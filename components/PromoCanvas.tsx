import React, { useEffect, useRef, useState } from 'react';
import { ProductAnalysis, LogoPosition } from '../types';

interface PromoCanvasProps {
  imageBase64: string;
  analysis: ProductAnalysis;
  customLogo?: string | null;
  logoPosition?: LogoPosition;
  logoSize?: number; // 10 to 100 (percentage of width)
  displayUrl?: string;
  onCompositionComplete: (dataUrl: string) => void;
}

const PromoCanvas: React.FC<PromoCanvasProps> = ({ 
  imageBase64, 
  analysis, 
  customLogo,
  logoPosition = 'top-center',
  logoSize = 30,
  displayUrl = '4ourmedia.com',
  onCompositionComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Wait for fonts to ensure they render correctly on the canvas
  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !imageBase64 || !fontLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImages = async () => {
      const bgImg = new Image();
      bgImg.src = `data:image/png;base64,${imageBase64}`;
      await new Promise((resolve) => { bgImg.onload = resolve; });

      let logoImg: HTMLImageElement | null = null;
      if (customLogo) {
        logoImg = new Image();
        logoImg.src = customLogo;
        await new Promise((resolve) => { logoImg.onload = resolve; });
      }

      return { bgImg, logoImg };
    };

    loadImages().then(({ bgImg, logoImg }) => {
      // Dimensions for 9:16
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      // 1. Draw Background Image
      const scale = Math.max(width / bgImg.width, height / bgImg.height);
      const x = (width / 2) - (bgImg.width / 2) * scale;
      const y = (height / 2) - (bgImg.height / 2) * scale;
      ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);

      // 2. Add Overlay Gradient (stronger for better text readability)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
      gradient.addColorStop(0.4, 'rgba(0,0,0,0.35)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.6)');
      gradient.addColorStop(0.8, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Reset shadow before drawing text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // --- Text helpers ---
      // Auto-shrink: find the largest font size that fits within maxWidth
      const fitFontSize = (
        text: string,
        fontWeight: string,
        fontFamily: string,
        maxSize: number,
        minSize: number,
        maxW: number
      ): number => {
        let size = maxSize;
        while (size > minSize) {
          ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
          if (ctx.measureText(text).width <= maxW) break;
          size -= 2;
        }
        return size;
      };

      // Word-wrap: split text into lines that fit within maxW, auto-shrinking if needed
      const wrapText = (
        text: string,
        fontWeight: string,
        fontFamily: string,
        maxSize: number,
        minSize: number,
        maxW: number,
        maxLines: number = 3
      ): { lines: string[]; fontSize: number } => {
        let size = maxSize;
        let lines: string[] = [];
        while (size >= minSize) {
          ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
          const words = text.split(' ');
          lines = [];
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxW && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          if (lines.length <= maxLines) break;
          size -= 2;
        }
        return { lines, fontSize: size };
      };

      // 3. Draw Call to Action Badge (top banner for urgency)
      const ctaText = analysis.callToAction || 'GET YOURS NOW';
      const primaryColor = analysis.colors?.[0] || '#ef4444';
      
      // CTA Banner
      ctx.fillStyle = primaryColor;
      const bannerHeight = 70;
      const bannerY = 180;
      ctx.beginPath();
      ctx.roundRect(width * 0.15, bannerY, width * 0.7, bannerHeight, 35);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      const ctaFontSize = fitFontSize(ctaText.toUpperCase(), 'bold', '"Inter"', 32, 18, width * 0.62);
      ctx.font = `bold ${ctaFontSize}px "Inter"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ctaText.toUpperCase(), width / 2, bannerY + bannerHeight / 2);

      // 4. Draw Product Name (main focus - large and bold, auto-shrink & wrap)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const productText = analysis.productName.toUpperCase();
      const productMaxW = width * 0.88;
      const { lines: productLines, fontSize: productFontSize } = wrapText(
        productText, '900', '"Montserrat"', 95, 48, productMaxW, 2
      );
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${productFontSize}px "Montserrat"`;
      
      // Add glow effect for product name
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 0;
      
      const productLineHeight = productFontSize * 1.15;
      const productBlockHeight = productLines.length * productLineHeight;
      const productNameY = height * 0.68 - (productBlockHeight - productLineHeight) / 2;
      
      productLines.forEach((line, i) => {
        ctx.fillText(line, width / 2, productNameY + i * productLineHeight);
      });

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 5. Draw Headline (desire-driven hook, auto-shrink & wrap)
      const headlineText = analysis.headline.toUpperCase();
      const headlineMaxW = width * 0.88;
      const { lines: headlineLines, fontSize: headlineFontSize } = wrapText(
        headlineText, 'bold', '"Inter"', 52, 30, headlineMaxW, 2
      );
      
      ctx.fillStyle = primaryColor;
      ctx.font = `bold ${headlineFontSize}px "Inter"`;
      
      const headlineLineHeight = headlineFontSize * 1.2;
      const headlineStartY = productNameY + (productLines.length - 1) * productLineHeight + 90;
      
      headlineLines.forEach((line, i) => {
        ctx.fillText(line, width / 2, headlineStartY + i * headlineLineHeight);
      });

      // 6. Draw Subheadline (pain → solution)
      ctx.fillStyle = '#cbd5e1'; // slate-300
      ctx.font = '400 40px "Inter"';
      
      const subheadline = analysis.subheadline || '';
      const subheadlineY = headlineStartY + (headlineLines.length - 1) * headlineLineHeight + 70;
      
      // Word wrap for subheadline
      const words = subheadline.split(' ');
      let line = '';
      let lineY = subheadlineY;
      const lineHeight = 50;
      const maxWidth = width * 0.85;

      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), width / 2, lineY);
          line = words[n] + ' ';
          lineY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), width / 2, lineY);

      // 7. Draw Social Proof / Urgency Line
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '300 28px "Inter"';
      const proofY = lineY + 80;
      ctx.fillText('★★★★★  Trusted by thousands', width / 2, proofY);

      // 8. Draw Branding URL at bottom
      if (displayUrl) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 36px "Inter"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(displayUrl.toUpperCase(), width / 2, height - 80);
      }

      // 9. Draw Custom Logo if exists
      if (logoImg) {
        // Calculate Logo Size
        const targetWidth = (width * logoSize) / 100;
        const logoScale = targetWidth / logoImg.width;
        const targetHeight = logoImg.height * logoScale;

        // Calculate Position
        const padding = 60;
        let lx = 0;
        let ly = 0;

        switch (logoPosition) {
          case 'top-left':
            lx = padding;
            ly = padding;
            break;
          case 'top-center':
            lx = (width - targetWidth) / 2;
            ly = padding;
            break;
          case 'top-right':
            lx = width - targetWidth - padding;
            ly = padding;
            break;
          case 'bottom-left':
            lx = padding;
            ly = height - targetHeight - padding - 100;
            break;
          case 'bottom-center':
            lx = (width - targetWidth) / 2;
            ly = height - targetHeight - padding - 100;
            break;
          case 'bottom-right':
            lx = width - targetWidth - padding;
            ly = height - targetHeight - padding - 100;
            break;
          default:
            lx = (width - targetWidth) / 2;
            ly = padding;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.drawImage(logoImg, lx, ly, targetWidth, targetHeight);
        ctx.shadowBlur = 0;
      }

      // 10. Output
      onCompositionComplete(canvas.toDataURL('image/png'));
    });

  }, [imageBase64, analysis, fontLoaded, onCompositionComplete, customLogo, logoPosition, logoSize, displayUrl]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

export default PromoCanvas;
