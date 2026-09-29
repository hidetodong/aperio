export default function ImageView({ url, name }: { url: string; name: string }) {
  return <img data-viewer="image" src={url} alt={name} />;
}
