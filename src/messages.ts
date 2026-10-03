export const MSG = {
  disabled: "这一段不支持这个格式",
  tooBig: "文件超过 2MB，这一段不整份读入",
  notText: "不支持这个文件",
  notFound: "找不到这个文件",
  notFile: "这不是文件",
  heicNeedsApp: "HEIC 需要在应用里用系统解码",
  oldOffice: "旧的 Word、Excel、PPT 这一段先不看",
  officeTooBig: "文件超过 20MB，这一段不整份解析",
  archiveSkipped: "tar 和 gz 这一段先不看",
  zipTooBig: "文件超过 20MB，这一段不整份解析",
  zipEntryTooBig: "这一项超过 20MB，先不取出来",
  zipListTruncated: "后面还有，这一段只列出前 2000 项",
  zipEncrypted: "这个压缩包有密码，这一段先不看",
  notZip: "这不是压缩包",
  zipInnerSkipped: "包里这一段只预览图片、文本和 PDF",
  zipHeic: "包里的 HEIC 这一段不解码",
  zipEmpty: "这个压缩包是空的",
  mediaFailed: "这个影音播不了",
} as const;

export const TEXT_LIMIT = 2 * 1024 * 1024;
