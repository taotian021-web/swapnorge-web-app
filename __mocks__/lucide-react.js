const React = require('react');

function createIcon(name) {
  const Icon = (props) => React.createElement('svg', { ...props, 'data-icon': name });
  Icon.displayName = name;
  return Icon;
}

module.exports = new Proxy({}, {
  get(target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return undefined;
    if (typeof prop === 'string') {
      return createIcon(prop);
    }
    return undefined;
  },
});
