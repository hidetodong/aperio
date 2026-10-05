use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const TOO_BIG: &str = "文件超过 2MB，这一段不整份读入";
pub const NOT_TEXT: &str = "不支持这个文件";
pub const NOT_FOUND: &str = "找不到这个文件";
pub const NOT_FILE: &str = "这不是文件";
pub const NOT_HEIC: &str = "这不是 HEIC";
pub const NO_SIPS: &str = "找不到系统命令 sips";
pub const HEIC_FAIL: &str = "HEIC 解码失败";
pub const SIPS_BIN: &str = "/usr/bin/sips";

const TEXT_LIMIT: u64 = 2 * 1024 * 1024;

pub fn require_file(path: &Path) -> Result<(), String> {
    let meta = fs::metadata(path).map_err(|_| NOT_FOUND.to_string())?;
    if !meta.is_file() {
        return Err(NOT_FILE.to_string());
    }
    Ok(())
}

pub fn read_text_file(path: &Path) -> Result<String, String> {
    require_file(path)?;
    let meta = fs::metadata(path).map_err(|_| NOT_FOUND.to_string())?;
    if meta.len() > TEXT_LIMIT {
        return Err(TOO_BIG.to_string());
    }
    let bytes = fs::read(path).map_err(|err| err.to_string())?;
    String::from_utf8(bytes).map_err(|_| NOT_TEXT.to_string())
}

pub fn ensure_heic(path: &Path) -> Result<(), String> {
    require_file(path)?;
    let ext = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if ext != "heic" && ext != "heif" {
        return Err(NOT_HEIC.to_string());
    }
    Ok(())
}

pub fn decode_heic(path: &Path, output: &Path) -> Result<PathBuf, String> {
    ensure_heic(path)?;
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let input = path.to_str().ok_or(NOT_HEIC)?;
    let out = output.to_str().ok_or(HEIC_FAIL)?;
    let status = Command::new(SIPS_BIN)
        .args(["-s", "format", "png", input, "--out", out])
        .status()
        .map_err(|_| NO_SIPS.to_string())?;
    if !status.success() || !output.is_file() {
        return Err(HEIC_FAIL.to_string());
    }
    Ok(output.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn scratch(name: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("aperio-{name}-{nanos}"))
    }

    #[test]
    fn reads_utf8_and_rejects_size_and_binary() {
        let path = scratch("note.txt");
        fs::write(&path, "你好").unwrap();
        assert_eq!(read_text_file(&path).unwrap(), "你好");

        let big = scratch("big.txt");
        fs::write(&big, vec![b'a'; TEXT_LIMIT as usize + 1]).unwrap();
        assert_eq!(read_text_file(&big).unwrap_err(), TOO_BIG);

        let binary = scratch("bin.txt");
        fs::write(&binary, [0xff, 0xfe]).unwrap();
        assert_eq!(read_text_file(&binary).unwrap_err(), NOT_TEXT);

        assert_eq!(
            read_text_file(Path::new("/tmp/aperio-missing-file.txt")).unwrap_err(),
            NOT_FOUND
        );

        let dir = scratch("dir");
        fs::create_dir(&dir).unwrap();
        assert_eq!(read_text_file(&dir).unwrap_err(), NOT_FILE);
        let _ = fs::remove_dir(dir);
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(big);
        let _ = fs::remove_file(binary);
    }

    #[test]
    fn heic_guard_rejects_other_extensions() {
        let path = scratch("pic.png");
        fs::write(&path, b"png").unwrap();
        assert_eq!(ensure_heic(&path).unwrap_err(), NOT_HEIC);
        let _ = fs::remove_file(path);
    }

    #[test]
    fn sips_decodes_system_heic_to_png() {
        assert_eq!(SIPS_BIN, "/usr/bin/sips");
        assert!(Path::new(SIPS_BIN).is_file(), "这台 Mac 上没有 /usr/bin/sips");
        let source = Path::new("/System/Library/CoreServices/DefaultDesktop.heic");
        if !source.is_file() {
            panic!("这台 Mac 上没有系统 HEIC 样例，解不了码");
        }
        let output = scratch("decoded.png");
        let decoded = decode_heic(source, &output).unwrap();
        let bytes = fs::read(&decoded).unwrap();
        assert!(bytes.starts_with(b"\x89PNG"));
        let _ = fs::remove_file(decoded);
    }
}
