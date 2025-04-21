"use client";

import { useState, useRef, useEffect } from "react";
import {
  Inter,
  Roboto,
  Open_Sans,
  Noto_Sans_JP,
  Dela_Gothic_One,
  Zen_Kaku_Gothic_New,
} from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ["latin"] });
const openSans = Open_Sans({ subsets: ["latin"] });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });
const delaGothicOne = Dela_Gothic_One({ subsets: ["latin"], weight: "400" });
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: "400",
});

interface TextLayer {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
}

const drawCenterLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.save();
  ctx.strokeStyle = "#000"; // 中心線の色
  ctx.lineWidth = 5; // 中心線の太さ

  // 水平線
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.restore();
};

const drawVerticalCenterLine = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.save();
  ctx.strokeStyle = "#000"; // 縦線の色を赤に設定
  ctx.lineWidth = 5; // 縦線の太さを設定

  // 中心の垂直線を描画
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  ctx.restore();
};

export default function Catchcraft() {
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);
  const [textLayer, setTextLayer] = useState<TextLayer | null>(null);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false); // 移動モードの状態
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && backgroundImage) {
      // キャンバスのサイズを画像に合わせる
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;

      // 背景画像を描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backgroundImage, 0, 0);

      // 中心線を描画
      drawCenterLines(ctx, canvas.width, canvas.height);

      // 垂直線を描画
      drawVerticalCenterLine(ctx, canvas.width, canvas.height);

      // テキストレイヤーを描画
      if (textLayer) {
        const fontFamily = textLayer.fontFamily || "sans-serif";
        const fontWeight = textLayer.fontWeight || "400";
        ctx.font = `${fontWeight} ${textLayer.fontSize}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const lines = textLayer.text.split("\n");
        const lineHeight = textLayer.fontSize * 1.2; // 行間をフォントサイズの1.2倍に設定

        // テキスト全体の高さを計算
        const totalTextHeight = lines.length * lineHeight;
        const startY = textLayer.y - totalTextHeight / 2 + lineHeight / 2; // 中心位置を維持

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          ctx.fillText(line, textLayer.x, y);
        });
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => setBackgroundImage(img);
      img.src = URL.createObjectURL(file);
    }
  };

  const handleAddTextLayer = () => {
    if (textLayer) return; // すでにテキストが存在する場合は追加しない

    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width || 0;
    const canvasHeight = canvas?.height || 0;

    const newTextLayer: TextLayer = {
      id: Date.now(),
      text: "新しいテキスト",
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      fontSize: 300,
      fontFamily: "sans-serif",
      fontWeight: "400",
    };
    setTextLayer(newTextLayer);
    setShowTextSettings(true); // テキスト設定セクションを表示
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMoveMode || !textLayer) return; // 移動モードでない場合は無視

    const step = 10; // 移動量
    let newX = textLayer.x;
    let newY = textLayer.y;

    switch (event.key) {
      case "ArrowUp":
        newY -= step;
        break;
      case "ArrowDown":
        newY += step;
        break;
      case "ArrowLeft":
        newX -= step;
        break;
      case "ArrowRight":
        newX += step;
        break;
      default:
        return;
    }

    setTextLayer({ ...textLayer, x: newX, y: newY });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMoveMode || !textLayer) return; // 移動モードでない場合は無視

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    const initialX = textLayer.x;
    const initialY = textLayer.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;

      // キャンバスのスケールを考慮
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const deltaX = (currentX - startX) * scaleX;
      const deltaY = (currentY - startY) * scaleY;

      setTextLayer({
        ...textLayer,
        x: initialX + deltaX,
        y: initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx && backgroundImage) {
        // 一時的に線を非表示にする
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0);

        if (textLayer) {
          const fontFamily = textLayer.fontFamily || "sans-serif";
          const fontWeight = textLayer.fontWeight || "400";
          ctx.font = `${fontWeight} ${textLayer.fontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const lines = textLayer.text.split("\n");
          const lineHeight = textLayer.fontSize * 1.2;
          const totalTextHeight = lines.length * lineHeight;
          const startY = textLayer.y - totalTextHeight / 2 + lineHeight / 2;

          lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            ctx.fillText(line, textLayer.x, y);
          });
        }

        // ダウンロード処理
        const link = document.createElement("a");
        link.download = "catchcraft-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        // 元の状態に戻す
        redrawCanvas();
      }
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [backgroundImage, textLayer]);

  return (
    <div
      className="min-h-screen p-8 bg-gradient-to-r from-blue-50 to-blue-100"
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-600 drop-shadow-md">
        Catchcraft
      </h1>

      {/* サイドバー */}
      <div className="fixed top-0 left-0 h-full w-80 bg-gray-100 shadow-lg p-6 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-gray-700">設定</h2>

        {/* 背景画像アップロード */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-4">
            背景画像をアップロード
          </label>
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
          />
        </div>

        {/* フォントサイズと種類の選択 */}
        {showTextSettings && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-gray-700">
                テキスト内容
              </h3>
              <textarea
                value={textLayer?.text || ""}
                onChange={(e) => {
                  if (textLayer) {
                    setTextLayer({ ...textLayer, text: e.target.value });
                  }
                }}
                rows={3}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              ></textarea>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-gray-700">
                フォントサイズ
              </h3>
              <select
                value={textLayer?.fontSize || 300}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value, 10);
                  if (textLayer) {
                    setTextLayer({ ...textLayer, fontSize: newSize });
                  }
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              >
                {[300, 400, 500, 600, 700, 800, 900, 1000].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-gray-700">
                フォントの種類
              </h3>
              <select
                onChange={(e) => {
                  const newFont = e.target.value;
                  if (textLayer) {
                    setTextLayer({ ...textLayer, fontFamily: newFont });
                  }
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              >
                {[
                  { label: "Inter", value: "Inter" },
                  { label: "Roboto", value: "Roboto" },
                  { label: "Open Sans", value: "Open Sans" },
                  { label: "Noto Sans JP", value: "Noto Sans JP" },
                  { label: "Dela Gothic One", value: "Dela Gothic One" },
                  {
                    label: "Zen Kaku Gothic New",
                    value: "Zen Kaku Gothic New",
                  },
                ].map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-gray-700">
                フォントウェイト
              </h3>
              <select
                onChange={(e) => {
                  const newWeight = e.target.value;
                  if (textLayer) {
                    setTextLayer({ ...textLayer, fontWeight: newWeight });
                  }
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              >
                {[
                  "100",
                  "200",
                  "300",
                  "400",
                  "500",
                  "600",
                  "700",
                  "800",
                  "900",
                ].map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!textLayer && (
          <button
            onClick={handleAddTextLayer}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            テキスト追加
          </button>
        )}

        {/* 移動モード切り替えボタン */}
        <button
          onClick={() => setIsMoveMode(!isMoveMode)}
          className={`flex items-center gap-2 px-6 py-3 ${
            isMoveMode
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white text-lg font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400`}
        >
          {isMoveMode ? "移動モード終了" : "移動モード開始"}
        </button>

        {/* ダウンロードボタン */}
        <button
          onClick={handleDownload}
          className="mt-auto px-6 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          ダウンロード
        </button>
      </div>

      {/* キャンバスエリア */}
      <div className="relative w-full max-w-4xl mx-auto border border-gray-300 bg-white shadow-lg rounded-lg flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-auto" />
      </div>
    </div>
  );
}
