# PWA Icons

Für eine vollständige PWA benötigen Sie Icons in folgenden Größen:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Schnelle Icon-Generierung

Sie können ein einzelnes großes Icon (mindestens 512x512) mit einem Online-Tool wie:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

konvertieren lassen, oder mit ImageMagick:

```bash
# Beispiel: Ein großes Logo zu allen Größen konvertieren
convert logo.png -resize 72x72 icons/icon-72x72.png
convert logo.png -resize 96x96 icons/icon-96x96.png
convert logo.png -resize 128x128 icons/icon-128x128.png
convert logo.png -resize 144x144 icons/icon-144x144.png
convert logo.png -resize 152x152 icons/icon-152x152.png
convert logo.png -resize 192x192 icons/icon-192x192.png
convert logo.png -resize 384x384 icons/icon-384x384.png
convert logo.png -resize 512x512 icons/icon-512x512.png
```

Für jetzt wird ein Fallback-Icon verwendet, falls die Dateien nicht existieren.
