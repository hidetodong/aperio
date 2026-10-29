export const UNSUPPORTED_FORMAT = "暂不支持的文件格式";

export const MSG = {
  disabled: UNSUPPORTED_FORMAT,
  tooBig: "文件超过 2MB，这一段不整份读入",
  notText: UNSUPPORTED_FORMAT,
  htmlUnsafe: "这个网页没法安全打开",
  notFound: "找不到这个文件",
  notFile: "这不是文件",
  heicNeedsApp: "HEIC 需要在应用里用系统解码",
  oldOffice: UNSUPPORTED_FORMAT,
  officeTooBig: "文件超过 20MB，这一段不整份解析",
  archiveSkipped: UNSUPPORTED_FORMAT,
  zipTooBig: "文件超过 20MB，这一段不整份解析",
  zipEntryTooBig: "这一项超过 20MB，先不取出来",
  zipListTruncated: "后面还有，这一段只列出前 2000 项",
  zipEncrypted: "这个压缩包有密码，这一段先不看",
  notZip: "这不是压缩包",
  zipInnerSkipped: "包里这一段只预览图片、文本和 PDF",
  zipHeic: "包里的 HEIC 这一段不解码",
  zipEmpty: "这个压缩包是空的",
  mediaFailed: "这个影音播不了",
  playbackMissing: "播放组件没装好",
} as const;

export const TEXT_LIMIT = 2 * 1024 * 1024;
