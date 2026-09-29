mod files;

use files::{decode_heic, read_text_file, require_file};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_text,
            decode_heic_image,
            confirm_file,
            retain_decoded_image,
            read_recents,
            write_recents
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
        let dir = std::env::temp_dir().join(format!("emerge-recents-{nanos}"));
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
        let cache = std::env::temp_dir().join(format!("emerge-cache-{nanos}"));
        let outside = std::env::temp_dir().join(format!("emerge-outside-{nanos}.png"));
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
        let cache = std::env::temp_dir().join(format!("emerge-stale-{nanos}"));
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
}
