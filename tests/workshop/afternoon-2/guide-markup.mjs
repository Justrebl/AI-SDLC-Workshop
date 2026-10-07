export function withoutDetails(text) {
  let visible = text;
  while (visible.includes('<details>')) {
    const next = visible.replace(/<details>(?:(?!<details>)[\s\S])*?<\/details>/g, '');
    if (next === visible) throw new Error('Unbalanced disclosure markup');
    visible = next;
  }
  return visible;
}
