# My Expenses - Extended Insights

## File Import

### My Expenses - Settings

My Expenses > Settings > Import / Export > Export to CSV

[/] Use separate columns for each level of category hierarchy

[/] Use searate columns for income and expenses

[/] Use separate columns for date and time

[ ] Original amount / Equivalent Amount

### My Expenses - Export

Data format: CSV

Delimiter: ","

Date format/ Time format: dd.MM.yy / HH:mm

Decimal separator: "."

Character encoding: UTF-8

## Minify

### Installation

```npm install -g html-minifier-terser```

### Usage

```
html-minifier-terser finance.html -o index.html \
  --collapse-whitespace \
  --remove-comments \
  --minify-css true \
  --minify-js true
```
