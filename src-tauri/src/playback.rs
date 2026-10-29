use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const MISSING: &str = "播放组件没装好";
pub const FAIL: &str = "这个影音播不了";
pub const NOT_PREP: &str = "这个文件不用另外准备";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Streams {
    pub video: Option<String>,
    pub audio: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Plan {
    Remux,
    Transcode,
}

pub fn output_name(id: u64) -> String {
    format!("playback-{id}.mp4")
}

pub fn needs_prep(path: &Path) -> bool {
    matches!(extension_of(path).as_str(), "mkv" | "avi" | "wmv")
}

pub fn read_streams(text: &str) -> Streams {
    Streams {
        video: codec_of(text, "video"),
        audio: codec_of(text, "audio"),
    }
}

pub fn plan_of(streams: &Streams) -> Result<Plan, String> {
    if streams.video.is_none() && streams.audio.is_none() {
        return Err(FAIL.to_string());
    }
    let video_ok = streams.video.as_deref().map(can_remux_video).unwrap_or(true);
    let audio_ok = streams.audio.as_deref().map(can_remux_audio).unwrap_or(true);
    if video_ok && audio_ok {
        Ok(Plan::Remux)
    } else {
        Ok(Plan::Transcode)
    }
}

pub fn prepare(ffmpeg: &Path, input: &Path, output: &Path) -> Result<PathBuf, String> {
    if !ffmpeg.is_file() {
        return Err(MISSING.to_string());
    }
    if !needs_prep(input) {
        return Err(NOT_PREP.to_string());
    }
    if !input.is_file() {
        return Err(FAIL.to_string());
    }
    if input == output {
        return Err(FAIL.to_string());
    }
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let before = fingerprint(input)?;
    let probe = probe(ffmpeg, input)?;
    let streams = read_streams(&probe);
    let plan = plan_of(&streams)?;
    let has_video = streams.video.is_some();
    let has_audio = streams.audio.is_some();
    let ran = match plan {
        Plan::Remux => {
            run(ffmpeg, &remux_args(input, output, has_video, has_audio))?
                || transcode(ffmpeg, input, output, has_video, has_audio)?
        }
        Plan::Transcode => transcode(ffmpeg, input, output, has_video, has_audio)?,
    };
    if !ran || !output.is_file() {
        let _ = fs::remove_file(output);
        return Err(FAIL.to_string());
    }
    if fingerprint(input)? != before {
        let _ = fs::remove_file(output);
        return Err(FAIL.to_string());
    }
    Ok(output.to_path_buf())
}

fn fingerprint(path: &Path) -> Result<(u64, Option<std::time::SystemTime>), String> {
    let meta = fs::metadata(path).map_err(|_| FAIL.to_string())?;
    Ok((meta.len(), meta.modified().ok()))
}

pub fn make_executable(path: &Path) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut permissions = fs::metadata(path).map_err(|_| MISSING.to_string())?.permissions();
        permissions.set_mode(0o755);
        fs::set_permissions(path, permissions).map_err(|_| MISSING.to_string())?;
    }
    Ok(())
}

fn extension_of(path: &Path) -> String {
    path.extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
}

fn codec_of(text: &str, kind: &str) -> Option<String> {
    let needle = format!("{kind}:");
    for line in text.lines() {
        let lower = line.to_ascii_lowercase();
        if !lower.contains("stream #") {
            continue;
        }
        let Some(at) = lower.find(&needle) else {
            continue;
        };
        let rest = line[at + needle.len()..].trim();
        let token = rest
            .split(|ch: char| ch == ',' || ch == ' ' || ch == '(')
            .find(|part| !part.is_empty())?;
        return Some(token.to_ascii_lowercase());
    }
    None
}

fn can_remux_video(codec: &str) -> bool {
    matches!(codec, "h264" | "hevc" | "h265" | "av1" | "prores")
}

fn can_remux_audio(codec: &str) -> bool {
    matches!(codec, "aac" | "mp3" | "alac" | "ac3" | "eac3")
}

fn remux_args(input: &Path, output: &Path, has_video: bool, has_audio: bool) -> Vec<String> {
    let mut args = base_args(input);
    push_maps(&mut args, has_video, has_audio);
    args.push("-c".to_string());
    args.push("copy".to_string());
    push_faststart(&mut args, output);
    args
}

fn transcode_args(
    input: &Path,
    output: &Path,
    has_video: bool,
    has_audio: bool,
    video_codec: &str,
) -> Vec<String> {
    let mut args = base_args(input);
    push_maps(&mut args, has_video, has_audio);
    if has_video {
        args.push("-c:v".to_string());
        args.push(video_codec.to_string());
        if video_codec == "h264_videotoolbox" {
            args.push("-b:v".to_string());
            args.push("8M".to_string());
        } else {
            args.push("-preset".to_string());
            args.push("veryfast".to_string());
            args.push("-crf".to_string());
            args.push("23".to_string());
        }
    }
    if has_audio {
        args.push("-c:a".to_string());
        args.push("aac".to_string());
    } else {
        args.push("-an".to_string());
    }
    push_faststart(&mut args, output);
    args
}

fn base_args(input: &Path) -> Vec<String> {
    vec![
        "-nostdin".to_string(),
        "-y".to_string(),
        "-hide_banner".to_string(),
        "-loglevel".to_string(),
        "error".to_string(),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
    ]
}

fn push_maps(args: &mut Vec<String>, has_video: bool, has_audio: bool) {
    if has_video {
        args.push("-map".to_string());
        args.push("0:v:0".to_string());
    }
    if has_audio {
        args.push("-map".to_string());
        args.push("0:a:0".to_string());
    }
}

fn push_faststart(args: &mut Vec<String>, output: &Path) {
    args.push("-movflags".to_string());
    args.push("+faststart".to_string());
    args.push(output.to_string_lossy().into_owned());
}

fn transcode(ffmpeg: &Path, input: &Path, output: &Path, has_video: bool, has_audio: bool) -> Result<bool, String> {
    if has_video && run(ffmpeg, &transcode_args(input, output, has_video, has_audio, "h264_videotoolbox"))? {
        return Ok(true);
    }
    if has_video && run(ffmpeg, &transcode_args(input, output, has_video, has_audio, "libx264"))? {
        return Ok(true);
    }
    if !has_video && has_audio && run(ffmpeg, &transcode_args(input, output, false, true, "aac"))? {
        return Ok(true);
    }
    Ok(false)
}

fn probe(ffmpeg: &Path, input: &Path) -> Result<String, String> {
    let output = Command::new(ffmpeg)
        .args(["-hide_banner", "-nostdin", "-i"])
        .arg(input)
        .output()
        .map_err(|_| FAIL.to_string())?;
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stderr),
        String::from_utf8_lossy(&output.stdout)
    );
    if !text.to_ascii_lowercase().contains("stream #") {
        return Err(FAIL.to_string());
    }
    Ok(text)
}

fn run(ffmpeg: &Path, args: &[String]) -> Result<bool, String> {
    let status = Command::new(ffmpeg)
        .args(args)
        .status()
        .map_err(|_| FAIL.to_string())?;
    Ok(status.success())
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
        std::env::temp_dir().join(format!("aperio-play-{name}-{nanos}"))
    }

    #[test]
    fn missing_component_is_not_a_bad_file() {
        let err = prepare(
            Path::new("/no/such/aperio-ffmpeg"),
            Path::new("/tmp/a.mkv"),
            Path::new("/tmp/a-out.mp4"),
        )
        .unwrap_err();
        assert_eq!(err, MISSING);
        assert_ne!(err, FAIL);
    }

    #[test]
    fn probe_chooses_remux_or_transcode() {
        let direct = read_streams("Stream #0:0: Video: h264 (High), yuv420p\nStream #0:1: Audio: aac (LC), 48000 Hz");
        assert_eq!(plan_of(&direct).unwrap(), Plan::Remux);
        let hevc = read_streams("Stream #0:0: Video: hevc (Main), yuv420p");
        assert_eq!(plan_of(&hevc).unwrap(), Plan::Remux);
        let vp9 = read_streams("Stream #0:0: Video: vp9, yuv420p\nStream #0:1: Audio: opus, 48000 Hz");
        assert_eq!(plan_of(&vp9).unwrap(), Plan::Transcode);
        let flac = read_streams("Stream #0:0: Video: h264\nStream #0:1: Audio: flac, 48000 Hz");
        assert_eq!(plan_of(&flac).unwrap(), Plan::Transcode);
        let wmv = read_streams("Stream #0:0: Video: wmv3 (Main), yuv420p");
        assert_eq!(plan_of(&wmv).unwrap(), Plan::Transcode);
        assert!(plan_of(&read_streams("nothing")).is_err());
    }

    #[test]
    fn only_mkv_avi_and_wmv_are_prepared() {
        assert!(needs_prep(Path::new("/tmp/a.MKV")));
        assert!(needs_prep(Path::new("/tmp/a.avi")));
        assert!(needs_prep(Path::new("/tmp/a.WMV")));
        assert!(!needs_prep(Path::new("/tmp/a.webm")));
        assert!(!needs_prep(Path::new("/tmp/a.m4v")));
        assert!(!needs_prep(Path::new("/tmp/a.mp4")));
        assert_eq!(output_name(3), "playback-3.mp4");
    }

    #[test]
    fn sample_keeps_the_original_bytes() {
        let ffmpeg = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources").join("ffmpeg");
        if !ffmpeg.is_file() {
            return;
        }
        let dir = scratch("sample");
        fs::create_dir_all(&dir).unwrap();
        let mkv = dir.join("clip.mkv");
        let avi = dir.join("clip.avi");
        let wmv = dir.join("clip.wmv");
        let made_mkv = Command::new(&ffmpeg)
            .args([
                "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "testsrc=size=160x120:rate=1:duration=1",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an",
            ])
            .arg(&mkv)
            .status()
            .unwrap();
        assert!(made_mkv.success());
        let made_avi = Command::new(&ffmpeg)
            .args([
                "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "testsrc=size=160x120:rate=1:duration=1",
                "-c:v", "mpeg4", "-an",
            ])
            .arg(&avi)
            .status()
            .unwrap();
        assert!(made_avi.success());
        let made_wmv = Command::new(&ffmpeg)
            .args([
                "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "testsrc=size=160x120:rate=1:duration=1",
                "-c:v", "wmv2", "-an",
            ])
            .arg(&wmv)
            .status()
            .unwrap();
        assert!(made_wmv.success());
        let mkv_before = fs::read(&mkv).unwrap();
        let avi_before = fs::read(&avi).unwrap();
        let wmv_before = fs::read(&wmv).unwrap();
        let mkv_in = read_streams(&probe(&ffmpeg, &mkv).unwrap());
        let avi_in = read_streams(&probe(&ffmpeg, &avi).unwrap());
        assert_eq!(plan_of(&mkv_in).unwrap(), Plan::Remux);
        assert_eq!(mkv_in.video.as_deref(), Some("h264"));
        assert_eq!(plan_of(&avi_in).unwrap(), Plan::Transcode);
        assert_eq!(avi_in.video.as_deref(), Some("mpeg4"));
        let wmv_in = read_streams(&probe(&ffmpeg, &wmv).unwrap());
        assert_eq!(plan_of(&wmv_in).unwrap(), Plan::Transcode);
        assert_eq!(wmv_in.video.as_deref(), Some("wmv2"));
        let mkv_out = dir.join("from-mkv.mp4");
        let avi_out = dir.join("from-avi.mp4");
        let wmv_out = dir.join("from-wmv.mp4");
        prepare(&ffmpeg, &mkv, &mkv_out).unwrap();
        prepare(&ffmpeg, &avi, &avi_out).unwrap();
        prepare(&ffmpeg, &wmv, &wmv_out).unwrap();
        assert_eq!(fs::read(&mkv).unwrap(), mkv_before);
        assert_eq!(fs::read(&avi).unwrap(), avi_before);
        assert_eq!(fs::read(&wmv).unwrap(), wmv_before);
        assert_ne!(mkv_out, mkv);
        assert_ne!(avi_out, avi);
        assert_ne!(wmv_out, wmv);
        assert!(fs::read(&mkv_out).unwrap().windows(4).any(|chunk| chunk == b"ftyp"));
        assert!(fs::read(&avi_out).unwrap().windows(4).any(|chunk| chunk == b"ftyp"));
        assert!(fs::read(&wmv_out).unwrap().windows(4).any(|chunk| chunk == b"ftyp"));
        assert_eq!(read_streams(&probe(&ffmpeg, &mkv_out).unwrap()).video.as_deref(), Some("h264"));
        assert_eq!(read_streams(&probe(&ffmpeg, &avi_out).unwrap()).video.as_deref(), Some("h264"));
        assert_eq!(read_streams(&probe(&ffmpeg, &wmv_out).unwrap()).video.as_deref(), Some("h264"));
        let _ = fs::remove_dir_all(dir);
    }
}
