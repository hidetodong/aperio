import { useEffect, useRef, useState } from "react";
import { explainFailure } from "../../open/openFile";
import { OfficeBody } from "./OfficeBody";
import type { OfficeModel } from "./model";

function OfficeSession({
  url,
  name,
  loadOffice = readOfficeFile,
  onFail,
  onReady,
}: {
  url: string;
  name: string;
  loadOffice?: (url: string, name: string) => Promise<OfficeModel>;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  const onFailRef = useRef(onFail);
  const onReadyRef = useRef(onReady);
  onFailRef.current = onFail;
  onReadyRef.current = onReady;
  const [model, setModel] = useState<OfficeModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadOffice(url, name)
      .then((next) => {
        if (cancelled) return;
        setModel(next);
        onReadyRef.current?.();
      })
      .catch((error: unknown) => {
        if (!cancelled) onFailRef.current?.(explainFailure(error));
      });
    return () => {
      cancelled = true;
    };
  }, [url, name, loadOffice]);

  return (
    <div data-viewer="office">
      {model ? <OfficeBody model={model} /> : <p className="muted">正在打开</p>}
    </div>
  );
}

async function readOfficeFile(url: string, name: string): Promise<OfficeModel> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("打不开");
  const bytes = await response.arrayBuffer();
  const { readOffice } = await import("./readOffice");
  return readOffice(name, bytes);
}

export default function OfficeView(props: {
  url: string;
  name: string;
  loadOffice?: (url: string, name: string) => Promise<OfficeModel>;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  return <OfficeSession key={`${props.url}\0${props.name}`} {...props} />;
}
