mod files;

use files::{decode_heic, read_text_file, require_file};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

fn heic_publish_lock() -> &'static Mutex<u64> {
    static SLOT: OnceLock<Mutex<u64>> = OnceLock::new();
    SLOT.get_or_init(|| Mutex::new(0))
}

fn published_id(path: &Path) -> Option<u64> {
    let name = path.file_name()?.to_str()?;
    let number = name.strip_prefix("current-")?.strip_suffix(".png")?;
    number.parse().ok()
}

fn retain_published(cache_dir: &Path, keep: &Path, latest: u64) -> Result<(), String> {
    if let Some(id) = published_id(keep) {
        if id != latest {
            return Ok(());
        }
    }
    retain_cached_png(cache_dir, keep)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RecentItem {
    path: String,
    name: String,
    opened_at: i64,
}

fn recents_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join("recents.json"))
}

fn remove_other_pngs(dir: &Path, keep: &Path) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path != keep && path.extension().and_then(|ext| ext.to_str()) == Some("png") {
            let _ = fs::remove_file(path);
        }
    }
}

fn load_recents(path: &Path) -> Result<Vec<RecentItem>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let text = fs::read_to_string(path).map_err(|err| err.to_string())?;
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&text).map_err(|err| err.to_string())
}

fn store_recents(path: &Path, items: &[RecentItem]) -> Result<(), String> {
    if items.len() > 20 {
        return Err("最近列表最多 20 条".to_string());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let text = serde_json::to_string(items).map_err(|err| err.to_string())?;
    fs::write(path, text).map_err(|err| err.to_string())
}

#[tauri::command]
fn read_text(path: String) -> Result<String, String> {
    read_text_file(PathBuf::from(path).as_path())
}

#[tauri::command]
fn decode_heic_image(app: AppHandle, path: String) -> Result<String, String> {
    let mut latest = heic_publish_lock()
        .lock()
        .unwrap_or_else(|err| err.into_inner());
    let dir = app.path().app_cache_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    let id = latest.checked_add(1).ok_or_else(|| files::HEIC_FAIL.to_string())?;
    let output = dir.join(format!("current-{id}.png"));
    let decoded = match decode_heic(Path::new(&path), &output) {
        Ok(decoded) => decoded,
        Err(err) => {
            let _ = fs::remove_file(&output);
            return Err(err);
        }
    };
    *latest = id;
    decoded
        .to_str()
        .map(str::to_string)
        .ok_or_else(|| files::HEIC_FAIL.to_string())
}

fn retain_cached_png(cache_dir: &Path, keep: &Path) -> Result<(), String> {
    let cache = cache_dir
        .canonicalize()
        .map_err(|_| "找不到缓存目录".to_string())?;
    let kept = keep.canonicalize().map_err(|_| files::HEIC_FAIL.to_string())?;
    if kept.parent() != Some(cache.as_path()) {
        return Err("解码缓存路径不对".to_string());
    }
    if kept.extension().and_then(|ext| ext.to_str()) != Some("png") {
        return Err(files::HEIC_FAIL.to_string());
    }
    remove_other_pngs(&cache, &kept);
    Ok(())
}

#[tauri::command]
fn confirm_file(path: String) -> Result<(), String> {
    require_file(Path::new(&path))
}

#[tauri::command]
fn retain_decoded_image(app: AppHandle, path: String) -> Result<(), String> {
    let latest = heic_publish_lock()
        .lock()
        .unwrap_or_else(|err| err.into_inner());
    let cache = app.path().app_cache_dir().map_err(|err| err.to_string())?;
    retain_published(&cache, Path::new(&path), *latest)
}

#[tauri::command]
fn read_recents(app: AppHandle) -> Result<Vec<RecentItem>, String> {
    load_recents(&recents_file(&app)?)
}

#[tauri::command]
fn write_recents(app: AppHandle, items: Vec<RecentItem>) -> Result<(), String> {
    store_recents(&recents_file(&app)?, &items)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ListedFile {
    path: String,
    name: String,
    size: u64,
    modified_ms: i64,
    is_dir: bool,
    folder_count: u32,
    file_count: u32,
    rel: String,
}

const LIST_READ_CAP: usize = 5000;
const LIST_KEEP: usize = 400;

fn list_files(dir: &Path) -> Result<Vec<ListedFile>, String> {
    let entries = fs::read_dir(dir).map_err(|err| err.to_string())?;
    let mut files = Vec::new();
    for entry in entries {
        if files.len() >= LIST_READ_CAP {
            break;
        }
        let Ok(entry) = entry else { continue };
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        if !meta.is_file() {
            continue;
        }
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as i64)
            .unwrap_or(0);
        files.push(ListedFile {
            path: entry.path().to_string_lossy().into_owned(),
            name,
            size: meta.len(),
            modified_ms,
            is_dir: false,
            folder_count: 0,
            file_count: 0,
            rel: String::new(),
        });
    }
    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms).then_with(|| a.name.cmp(&b.name)));
    files.truncate(LIST_KEEP);
    Ok(files)
}

fn place_dir(place: &str) -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "找不到主目录".to_string())?;
    let rel = match place {
        "docs" => "Documents",
        "downloads" => "Downloads",
        "desktop" => "Desktop",
        "icloud" => "Library/Mobile Documents/com~apple~CloudDocs",
        _ => return Err("没有这个位置".to_string()),
    };
    Ok(PathBuf::from(home).join(rel))
}

#[tauri::command]
fn list_place(place: String) -> Result<Vec<ListedFile>, String> {
    let dir = place_dir(&place)?;
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    list_files(&dir)
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<ListedFile>, String> {
    let dir = PathBuf::from(&path);
    if !dir.is_dir() {
        return Err("这不是文件夹".to_string());
    }
    list_files(&dir)
}

const TREE_READ_CAP: usize = 8000;
const TREE_DIR_CAP: usize = 800;
const TREE_FILE_CAP: usize = 4000;

fn collect_tree(root: &Path) -> Result<Vec<ListedFile>, String> {
    if !root.is_dir() {
        return Err("这不是文件夹".to_string());
    }
    let mut out = Vec::new();
    let mut reads = 0usize;
    let mut dirs_left = TREE_DIR_CAP;
    let mut files_left = TREE_FILE_CAP;
    let _ = walk_tree(root, "", &mut out, &mut reads, &mut dirs_left, &mut files_left);
    Ok(out)
}

fn walk_tree(
    dir: &Path,
    rel: &str,
    out: &mut Vec<ListedFile>,
    reads: &mut usize,
    dirs_left: &mut usize,
    files_left: &mut usize,
) -> (u32, u32) {
    if *reads >= TREE_READ_CAP {
        return (0, 0);
    }
    *reads += 1;
    let Ok(entries) = fs::read_dir(dir) else {
        return (0, 0);
    };
    let mut subdirs: Vec<(PathBuf, String, String)> = Vec::new();
    let mut files_here = 0u32;
    for entry in entries {
        let Ok(entry) = entry else { continue };
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        if meta.is_dir() {
            let child_rel = if rel.is_empty() {
                name.clone()
            } else {
                format!("{rel}/{name}")
            };
            subdirs.push((entry.path(), name, child_rel));
        } else if meta.is_file() {
            files_here += 1;
            if *files_left > 0 {
                *files_left -= 1;
                let modified_ms = meta
                    .modified()
                    .ok()
                    .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
                    .map(|duration| duration.as_millis() as i64)
                    .unwrap_or(0);
                out.push(ListedFile {
                    path: entry.path().to_string_lossy().into_owned(),
                    name,
                    size: meta.len(),
                    modified_ms,
                    is_dir: false,
                    folder_count: 0,
                    file_count: 0,
                    rel: rel.to_string(),
                });
            }
        }
    }
    subdirs.sort_by(|a, b| a.1.cmp(&b.1));
    let mut recursive = files_here;
    let immediate = subdirs.len() as u32;
    for (path, name, child_rel) in subdirs {
        if *dirs_left == 0 || *reads >= TREE_READ_CAP {
            break;
        }
        *dirs_left -= 1;
        let (child_folders, child_files) = walk_tree(&path, &child_rel, out, reads, dirs_left, files_left);
        out.push(ListedFile {
            path: path.to_string_lossy().into_owned(),
            name,
            size: 0,
            modified_ms: 0,
            is_dir: true,
            folder_count: child_folders,
            file_count: child_files,
            rel: child_rel,
        });
        recursive += child_files;
    }
    (immediate, recursive)
}

#[tauri::command]
fn list_tree(path: String) -> Result<Vec<ListedFile>, String> {
    collect_tree(Path::new(&path))
}

fn check_extract(archive: &Path, dest: &Path) -> Result<(), String> {
    if !archive.is_absolute() || !dest.is_absolute() {
        return Err("路径不对".to_string());
    }
    if !archive.is_file() {
        return Err("这不是压缩包".to_string());
    }
    let ext = archive.extension().and_then(|item| item.to_str()).unwrap_or("");
    if !ext.eq_ignore_ascii_case("zip") {
        return Err("只能解压 zip".to_string());
    }
    if !dest.is_dir() {
        return Err("请选择一个文件夹".to_string());
    }
    Ok(())
}

#[tauri::command]
fn extract_zip(archive: String, dest: String) -> Result<(), String> {
    let archive = PathBuf::from(&archive);
    let dest = PathBuf::from(&dest);
    check_extract(&archive, &dest)?;
    let status = std::process::Command::new("/usr/bin/ditto")
        .args(["-x", "-k"])
        .arg(&archive)
        .arg(&dest)
        .status()
        .map_err(|_| "解压失败".to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("解压失败".to_string())
    }
}

#[tauri::command]
fn reveal_in_finder(path: String) -> Result<(), String> {
    let file = Path::new(&path);
    require_file(file)?;
    let status = std::process::Command::new("/usr/bin/open")
        .arg("-R")
        .arg(file)
        .status()
        .map_err(|_| "无法在访达中显示".to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("无法在访达中显示".to_string())
    }
}

fn focus_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn install_tray(app: &mut tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "显示 Aperio", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;
    let icon = Image::from_bytes(include_bytes!("../icons/menubar.png"))?;
    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .icon_as_template(true)
        .tooltip("Aperio")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => focus_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                focus_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            install_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_text,
            decode_heic_image,
            confirm_file,
            retain_decoded_image,
            read_recents,
            write_recents,
            list_place,
            list_directory,
            list_tree,
            extract_zip,
            reveal_in_finder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recents_roundtrip_uses_camel_case_and_rejects_overflow() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("aperio-recents-{nanos}"));
        let path = dir.join("recents.json");
        assert!(load_recents(&path).unwrap().is_empty());

        store_recents(
            &path,
            &[RecentItem {
                path: "/tmp/a.txt".into(),
                name: "a.txt".into(),
                opened_at: 7,
            }],
        )
        .unwrap();

        let raw = fs::read_to_string(&path).unwrap();
        assert!(raw.contains("\"openedAt\":7"));
        assert!(!raw.contains("opened_at"));
        let loaded = load_recents(&path).unwrap();
        assert_eq!(loaded[0].name, "a.txt");
        assert_eq!(loaded[0].opened_at, 7);

        let too_many: Vec<_> = (0..21)
            .map(|index| RecentItem {
                path: format!("/t/{index}"),
                name: format!("{index}"),
                opened_at: index,
            })
            .collect();
        assert!(store_recents(&path, &too_many).is_err());
        assert_eq!(load_recents(&path).unwrap().len(), 1);
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn retain_only_deletes_png_inside_cache() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let cache = std::env::temp_dir().join(format!("aperio-cache-{nanos}"));
        let outside = std::env::temp_dir().join(format!("aperio-outside-{nanos}.png"));
        fs::create_dir_all(&cache).unwrap();
        let keep = cache.join("keep.png");
        let other = cache.join("other.png");
        fs::write(&keep, b"keep").unwrap();
        fs::write(&other, b"other").unwrap();
        fs::write(&outside, b"out").unwrap();

        retain_cached_png(&cache, &keep).unwrap();
        assert!(keep.is_file());
        assert!(!other.exists());
        assert!(outside.is_file());
        assert!(retain_cached_png(&cache, &outside).is_err());
        assert!(outside.is_file());

        let _ = fs::remove_dir_all(cache);
        let _ = fs::remove_file(outside);
    }

    #[test]
    fn stale_publish_does_not_delete_newer_png() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let cache = std::env::temp_dir().join(format!("aperio-stale-{nanos}"));
        fs::create_dir_all(&cache).unwrap();
        let older = cache.join("current-1.png");
        let newer = cache.join("current-2.png");
        let junk = cache.join("other.png");
        fs::write(&older, b"old").unwrap();
        fs::write(&newer, b"new").unwrap();
        fs::write(&junk, b"junk").unwrap();

        retain_published(&cache, &older, 2).unwrap();
        assert!(older.is_file());
        assert!(newer.is_file());
        assert!(junk.is_file());

        retain_published(&cache, &newer, 2).unwrap();
        assert!(newer.is_file());
        assert!(!older.exists());
        assert!(!junk.exists());

        let outside = std::env::temp_dir().join(format!("current-2-{nanos}.png"));
        fs::write(&outside, b"out").unwrap();
        assert!(retain_published(&cache, &outside, 2).is_err());
        assert!(outside.is_file());
        assert!(newer.is_file());

        let _ = fs::remove_dir_all(cache);
        let _ = fs::remove_file(outside);
    }

    #[test]
    fn list_files_skips_hidden_and_directories() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("aperio-list-{nanos}"));
        fs::create_dir_all(dir.join("sub")).unwrap();
        fs::write(dir.join("b.txt"), b"hi").unwrap();
        fs::write(dir.join(".secret"), b"no").unwrap();
        let listed = list_files(&dir).unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].name, "b.txt");
        assert_eq!(listed[0].size, 2);
        assert!(place_dir("nope").is_err());
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn list_tree_counts_nested_files_and_skips_hidden() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("aperio-tree-{nanos}"));
        fs::create_dir_all(dir.join("sub/nested")).unwrap();
        fs::write(dir.join("a.txt"), b"hi").unwrap();
        fs::write(dir.join("sub/b.txt"), b"yo").unwrap();
        fs::write(dir.join("sub/nested/c.txt"), b"z").unwrap();
        fs::write(dir.join(".hidden"), b"no").unwrap();
        let listed = collect_tree(&dir).unwrap();
        let sub = listed.iter().find(|item| item.is_dir && item.rel == "sub").unwrap();
        assert_eq!(sub.folder_count, 1);
        assert_eq!(sub.file_count, 2);
        assert!(listed.iter().any(|item| item.is_dir && item.rel == "sub/nested"));
        assert!(listed.iter().any(|item| !item.is_dir && item.name == "a.txt" && item.rel.is_empty()));
        assert!(!listed.iter().any(|item| item.name.starts_with('.')));
        assert!(check_extract(Path::new("a.zip"), Path::new("/tmp")).is_err());
        assert!(check_extract(Path::new("/tmp/a.txt"), Path::new("/tmp")).is_err());
        let _ = fs::remove_dir_all(dir);
    }
}
