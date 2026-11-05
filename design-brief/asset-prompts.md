# String Sort — ассеты от GPT

Почти весь новый визуал по макетам из `design-brief/refs/` делается кодом: плашки, кнопки, карточки, прогресс-бар, доска, верёвки, иконки. От GPT нужны только картинки, которые кодом не нарисовать: фон с листьями и, по желанию, объёмный логотип.

---

## Как работать

1. Откройте **новый** чат с GPT и загрузите оба макета из `design-brief/refs/`:
   - `mockup-menu.png` — главное меню,
   - `mockup-gameplay.png` — игровой экран.

   Напишите: *«Это утверждённый стиль игры. Дальше прошу отдельные ассеты в точно таком же стиле: те же цвета, такой же мягкий тёплый свет и такое же размытие листьев.»*
2. Отправляйте промпты по одному. Каждый — целиком, вместе с общим блоком стиля.
3. Сохраняйте файлы под указанными именами в `design-brief/assets/`. Нужен самый большой вариант, без сжатия.
4. Прозрачный фон получился белым или в «шахматку» — ничего страшного, вырежу сам.

**Не нужно генерировать:** кнопки, плашки, иконки, доску, верёвки, цифры и надписи. Всё это делается кодом.

---

## Общий блок стиля (в начало каждого промпта)

```
Style: polished casual mobile puzzle game art, exactly matching the attached mockups. Warm cream-beige palette, soft golden sunlight, lush green tropical leaves with strong depth-of-field bokeh blur, a few small soft glowing light particles. Calm, cozy, bright. High quality. No text, no letters, no numbers, no logos, no UI, no buttons, no characters, no watermark.
```

---

## 1. Фон экрана — `bg.png` (обязательно)
Размер **1080×1920**, портрет, фон обычный. Один фон на все экраны.

```
[Общий блок стиля]
Vertical mobile game background, 1080x1920, portrait.
Soft warm cream-beige center (around #f7e8c8), bright and completely empty — no leaves, spots or objects in the middle 70% of the image, because the game board and buttons sit there.
Blurred green tropical leaves only along the edges and in the corners, heavily out of focus.
Warm sunlight glow coming from the top. A few tiny soft light particles near the edges.
```

**Проверить:** в центре нет листьев и тёмных пятен, иначе они полезут под доску.

---

## 2. Листья в углах — `leaves-top-left.png`, `leaves-bottom-right.png` (желательно)
Размер **1024×1024**, **прозрачный фон**. Листья накладываются поверх фона по углам, чтобы на планшетах и узких телефонах они не обрезались.

### `leaves-top-left.png`
```
[Общий блок стиля]
A cluster of blurred green tropical leaves for a corner overlay, top-left corner composition: leaves enter from the top edge and the left edge and fade toward the center. Soft bokeh blur, warm sunlight rim light on the leaf edges. The rest of the square is empty. Transparent background, PNG, 1024x1024.
```

### `leaves-bottom-right.png`
```
[Общий блок стиля]
A cluster of blurred green tropical leaves for a corner overlay, bottom-right corner composition: leaves enter from the bottom edge and the right edge and fade toward the center. Soft bokeh blur, warm sunlight rim light on the leaf edges. The rest of the square is empty. Transparent background, PNG, 1024x1024.
```

---

## 3. Логотип — `logo.png` (по желанию)
Размер **1600×900**, **прозрачный фон**. Без него в игре останется SVG-логотип, сделанный кодом.

Для этого промпта общий блок стиля **не добавлять**: в нём запрещён текст.

```
Game logo text "STRING SORT" on two lines, exactly matching the logo in the attached menu mockup.
"STRING" on top in glossy bright yellow-orange gradient letters, "SORT" below in glossy white letters.
Both lines have a thick dark navy outline and a soft 3D bevel, in a chunky rounded casual-game font.
Small yellow sparkle strokes on both sides.
Transparent background, PNG, 1600x900, logo centered with padding.
Spell exactly: S-T-R-I-N-G  S-O-R-T. No other text.
```

**Проверить:** буквы написаны правильно. GPT часто путает или дублирует их.

---

## Что сдать

| Файл | Размер | Фон | Обязательно |
|---|---|---|---|
| `bg.png` | 1080×1920 | обычный | да |
| `leaves-top-left.png` | 1024×1024 | прозрачный | желательно |
| `leaves-bottom-right.png` | 1024×1024 | прозрачный | желательно |
| `logo.png` | 1600×900 | прозрачный | по желанию |

Все файлы — в `design-brief/assets/`. Дальше я сам сожму их в webp и подключу в игру.
