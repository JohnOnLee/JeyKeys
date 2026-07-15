// src/lib/caret.js
export function getCaretCoordinates(element, position) {
  const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize'
  ];

  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return { top: 0, left: 0, height: 0 };

  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  properties.forEach(prop => {
    style[prop] = computed[prop];
  });

  style.width = element.clientWidth + 'px';
  style.height = element.clientHeight + 'px';

  div.textContent = element.value.substring(0, position);

  const span = document.createElement('span');
  span.textContent = element.value.substring(position, position + 1) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft,
    height: parseInt(computed.lineHeight) || span.offsetHeight
  };

  document.body.removeChild(div);

  return coordinates;
}
