# String Sort — иконки от GPT

Иконки в игре должны быть как на макетах `design-brief/refs/`: объёмные, глянцевые, мультяшные. Кодом (SVG) такой объём не повторить, поэтому нужен набор PNG.

---

## Как работать

1. Откройте **новый** чат с GPT и загрузите оба макета из `design-brief/refs/` (`mockup-menu.png`, `mockup-gameplay.png`).

   Напишите: *«Это утверждённый стиль игры. Нужен набор отдельных иконок в точно таком же стиле, как иконки на этих макетах: шестерёнка, плитки, лампочка, звезда, следы, узел, стрелки. Каждая иконка — отдельная картинка.»*
2. Отправляйте промпты по одному, каждый вместе с общим блоком стиля.
3. Сохраняйте файлы под указанными именами в `design-brief/icons/`.
4. Все иконки: **1024×1024, прозрачный фон, PNG**. Белый фон или «шахматка» — не страшно, вырежу сам.
5. Иконки одного набора должны выглядеть как семья: один свет (сверху слева), одна толщина обводки, один масштаб в кадре.

**Не нужно генерировать:** кнопки, плашки, подложки под иконками, цифры, текст. Только сам предмет.

---

## Общий блок стиля (в начало каждого промпта)

```
Style: a single glossy 3D cartoon game icon, exactly matching the icons in the attached mockups. Soft rounded volume, bright clean colors, a soft white specular highlight on the top-left, a subtle darker outline of the same hue, gentle inner shading. Light comes from the top-left. Centered, the object fills about 80% of the square, nothing touches the edges. Transparent background, PNG, 1024x1024. No background plate, no button, no frame, no shadow on the ground, no text, no letters, no numbers, no watermark. Must stay readable when shrunk to 32x32 pixels.
```

---

## Часть 1 — главные (обязательно)

Видны на главном и игровом экране.

| Файл | Что | Промпт (после общего блока) |
|---|---|---|
| `settings.png` | шестерёнка | `A chunky gear (cog) with 8 rounded teeth and a round hole in the middle, glossy navy-blue metal (#2c4f86) with a lighter blue top highlight.` |
| `levels.png` | плитки уровней | `Four rounded square tiles in a 2x2 grid with small gaps, glossy golden-yellow to orange gradient, each tile with its own small white shine.` |
| `hint.png` | подсказка | `A glowing yellow light bulb with a gray metal screw base, short orange light rays around the top half.` |
| `star.png` | звезда | `A plump five-pointed star with rounded tips, glossy golden yellow with an orange outline.` |
| `moves.png` | ходы | `Two small cartoon footprints side by side, each made of one oval sole and a heel pad, glossy deep blue (#2f5fc6).` |
| `knot.png` | узлы | `A thick glossy orange-yellow rope tied into a simple pretzel-like knot, the rope ends are hidden, clearly readable loops.` |
| `restart.png` | заново | `A thick circular arrow going clockwise, almost a full circle with a gap at the top right, big rounded arrowhead, glossy red (#ef3b3b).` |
| `undo.png` | отмена | `A thick circular arrow going counter-clockwise, almost a full circle with a gap at the top left, big rounded arrowhead, glossy cool gray (#a9b1bd).` |
| `pause.png` | пауза | `Two thick vertical rounded bars of a pause symbol, glossy dark navy (#1d3a66).` |
| `play.png` | играть | `A round white glossy disc with a bold green (#2ebf43) play triangle in the center.` |

## Часть 2 — второстепенные (желательно)

Экраны уровней, настроек, паузы и победы.

| Файл | Что | Промпт (после общего блока) |
|---|---|---|
| `back.png` | назад | `A bold rounded chevron pointing left, glossy dark navy (#1d3a66).` |
| `home.png` | домой | `A small cute house with a red roof and a cream wall with a round door.` |
| `lock.png` | замок | `A chunky padlock, glossy gray body with a golden keyhole, closed shackle.` |
| `trophy.png` | победа | `A shiny golden trophy cup with two handles on a small dark-blue base.` |
| `sound.png` | звук | `A cartoon speaker with two sound waves, glossy blue speaker and lighter blue waves.` |
| `haptics.png` | вибрация | `A cartoon smartphone with short vibration lines on both sides, glossy purple.` |
| `graphics.png` | графика | `A small landscape picture: a green hill and a yellow sun in a rounded frame.` |
| `info.png` | о игре | `A round glossy blue badge with a bold white letter i.` |
| `privacy.png` | конфиденциальность | `A glossy green shield with a white check mark.` |
| `reset.png` | сброс прогресса | `A cartoon trash bin, glossy red with a lid.` |

## Часть 3 — главы (желательно)

Вкладки глав на экране уровней. Все пять — один набор, на одинаковой круглой «медали» не нужно, только предмет.

| Файл | Глава | Промпт (после общего блока) |
|---|---|---|
| `chapter-knot.png` | First Knots | `A single simple loose rope knot, glossy red rope.` |
| `chapter-twist.png` | Twist Lab | `Two ropes, blue and yellow, twisted around each other like a spiral.` |
| `chapter-garden.png` | Tangle Garden | `A small green sprout with two leaves growing out of a coil of green rope.` |
| `chapter-weave.png` | Knot Works | `A small square of woven ropes in four colors, like a tiny basket weave.` |
| `chapter-crown.png` | Master Board | `A golden crown with three rounded points and small red and blue gems.` |

---

## Что проверить перед тем, как класть в репо

- фон прозрачный (или ровный белый);
- предмет по центру, не обрезан по краям;
- на всех иконках одинаковое направление света и похожая толщина обводки;
- на иконках нет текста и цифр (кроме буквы i на `info.png`).

Файлы — в `design-brief/icons/`. Дальше я сам обрежу, сожму в WebP и подключу.
