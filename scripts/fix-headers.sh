#!/bin/bash

echo "🔍 Checking for markdown headers in code files..."

FIXED=0

fix_file() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    return
  fi
  
  first_line=$(head -n 1 "$file")
  
  if [[ "$first_line" == "## "* ]] || [[ "$first_line" == "# "* ]] || [[ "$first_line" == "### "* ]]; then
    echo "❌ Found in: $file"
    echo "   Header: $first_line"
    
    tail -n +2 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    
    # Удаляем пустую строку если есть
    first_line=$(head -n 1 "$file")
    if [ -z "$first_line" ]; then
      tail -n +2 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
    
    echo "   ✅ Fixed!"
    FIXED=$((FIXED + 1))
  fi
}

# Проверяем все файлы
for file in lib/*.js agents/*.js scripts/*.js test/*.js; do
  fix_file "$file"
done

for file in config/*.json; do
  fix_file "$file"
done

echo ""
if [ $FIXED -eq 0 ]; then
  echo "✅ All files are clean!"
else
  echo "✅ Fixed $FIXED files!"
fi
