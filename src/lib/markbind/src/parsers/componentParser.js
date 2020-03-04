const cheerio = require('cheerio');

const _ = {};
_.has = require('lodash/has');

const vueAttrRenderer = require('../lib/vue-attribute-renderer');

cheerio.prototype.options.xmlMode = true; // Enable xml mode for self-closing tag
cheerio.prototype.options.decodeEntities = false; // Don't escape HTML entities

/*
 * Private utility functions
 */

/**
 * Parses the markdown attribute of the provided element, inserting the corresponding <slot> child
 * if there is no pre-existing slot child with the name of the attribute present.
 * @param node Element to parse
 * @param attribute Attribute name to parse
 * @param isInline Whether to parse the attribute with only inline markdown-it rules
 * @param slotName Name attribute of the <slot> element to insert, which defaults to the attribute name
 */
function _parseAttributeWithoutOverride(node, attribute, isInline, slotName = attribute) {
  const hasAttributeSlot = node.children
    && node.children.some(child => _.has(child.attribs, 'slot') && child.attribs.slot === slotName);

  if (!hasAttributeSlot && _.has(node.attribs, attribute)) {
    let rendered;
    if (isInline) {
      rendered = vueAttrRenderer.renderInline(node.attribs[attribute]);
    } else {
      rendered = vueAttrRenderer.render(node.attribs[attribute]);
    }

    const attributeSlotElement = cheerio.parseHTML(
      `<template slot="${slotName}">${rendered}</template>`, true);
    node.children
      = node.children ? attributeSlotElement.concat(node.children) : attributeSlotElement;
  }

  delete node.attribs[attribute];
}

/*
 * Panels
 */

function _parsePanelAttributes(node) {
  _parseAttributeWithoutOverride(node, 'alt', false, '_alt');

  const slotChildren = node.children && node.children.filter(child => _.has(child.attribs, 'slot'));
  const hasAltSlot = slotChildren && slotChildren.some(child => child.attribs.slot === '_alt');
  const hasHeaderSlot = slotChildren && slotChildren.some(child => child.attribs.slot === 'header');

  // If both are present, the header attribute has no effect, and we can simply remove it.
  if (hasAltSlot && hasHeaderSlot) {
    delete node.attribs.header;
    return;
  }

  _parseAttributeWithoutOverride(node, 'header', false, '_header');
}

/**
 * Traverses the dom breadth-first from the specified element to find a html heading child.
 * @param node Root element to search from
 * @returns {undefined|*} The header element, or undefined if none is found.
 */
function _findHeaderElement(node) {
  const elements = node.children;
  if (!elements || !elements.length) {
    return undefined;
  }

  const elementQueue = elements.slice(0);
  while (elementQueue.length) {
    const nextEl = elementQueue.shift();
    if ((/^h[1-6]$/).test(nextEl.name)) {
      return nextEl;
    }

    if (nextEl.children) {
      nextEl.children.forEach(child => elementQueue.push(child));
    }
  }

  return undefined;
}

/**
 * Assigns an id to the root element of a panel component using the heading specified in the
 * panel's header slot or attribute (if any), with the header slot having priority if present.
 * This is to ensure anchors still work when panels are in their minimized form.
 * @param node The root panel element
 */
function _assignPanelId(node) {
  const slotChildren = node.children && node.children.filter(child => _.has(child.attribs, 'slot'));
  const headerSlot = slotChildren.find(child => child.attribs.slot === 'header');
  const headerAttributeSlot = slotChildren.find(child => child.attribs.slot === '_header');

  const slotElement = headerSlot || headerAttributeSlot;
  if (slotElement) {
    const header = _findHeaderElement(slotElement);
    if (!header) {
      return;
    }

    if (!header.attribs || !_.has(header.attribs, 'id')) {
      throw new Error('Found a panel heading without an assigned id.\n'
        + 'Please report this to the MarkBind developers. Thank you!');
    }

    node.attribs.id = header.attribs.id;
  }
}


/*
 * Popovers
 */

function _parsePopoverAttributes(node) {
  _parseAttributeWithoutOverride(node, 'content', true);
  _parseAttributeWithoutOverride(node, 'header', true);
  // TODO deprecate title attribute for popovers
  _parseAttributeWithoutOverride(node, 'title', true, 'header');
}

/*
 * Tooltips
 */

function _parseTooltipAttributes(node) {
  _parseAttributeWithoutOverride(node, 'content', true, '_content');
}

/*
 * Modals
 */

function _renameSlot(node, originalName, newName) {
  if (node.children) {
    node.children.forEach((child) => {
      if (_.has(child.attribs, 'slot') && child.attribs.slot === originalName) {
        child.attribs.slot = newName;
      }
    });
  }
}

function _parseModalAttributes(node) {
  _parseAttributeWithoutOverride(node, 'header', true, '_header');
  // TODO deprecate title attribute for modals
  _parseAttributeWithoutOverride(node, 'title', true, '_header');

  // TODO deprecate modal-header, modal-footer attributes for modals
  _renameSlot(node, 'modal-header', 'header');
  _renameSlot(node, 'modal-footer', 'footer');
}

/*
 * Tabs
 */

function _parseTabAttributes(node) {
  _parseAttributeWithoutOverride(node, 'header', true, '_header');
}

/*
 * Tip boxes
 */

function _parseBoxAttributes(node) {
  _parseAttributeWithoutOverride(node, 'icon', true, '_icon');
  _parseAttributeWithoutOverride(node, 'header', false, '_header');

  // TODO deprecate heading attribute for box
  _parseAttributeWithoutOverride(node, 'heading', false, '_header');

  // TODO warn when light and seamless attributes are both present
}

/*
 * Dropdowns
 */

function _parseDropdownAttributes(node) {
  const slotChildren = node.children && node.children.filter(child => _.has(child.attribs, 'slot'));
  const hasHeaderSlot = slotChildren && slotChildren.some(child => child.attribs.slot === 'header');

  // If header slot is present, the header attribute has no effect, and we can simply remove it.
  if (hasHeaderSlot) {
    delete node.attribs.header;
    // TODO deprecate text attribute of dropdown
    delete node.attribs.text;
    return;
  }

  // header attribute takes priority over text attribute
  if (_.has(node.attribs, 'header')) {
    _parseAttributeWithoutOverride(node, 'header', true, '_header');
    delete node.attribs.text;
  } else {
    // TODO deprecate text attribute of dropdown
    _parseAttributeWithoutOverride(node, 'text', true, '_header');
  }
}

/*
 * API
 */

function parseComponents(node, errorHandler) {
  try {
    switch (node.name) {
    case 'panel':
      _parsePanelAttributes(node);
      break;
    case 'popover':
      _parsePopoverAttributes(node);
      break;
    case 'tooltip':
      _parseTooltipAttributes(node);
      break;
    case 'modal':
      _parseModalAttributes(node);
      break;
    case 'tab':
    case 'tab-group':
      _parseTabAttributes(node);
      break;
    case 'box':
      _parseBoxAttributes(node);
      break;
    case 'dropdown':
      _parseDropdownAttributes(node);
      break;
    default:
      break;
    }
  } catch (error) {
    if (!errorHandler) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    errorHandler(error);
  }
}

function postParseComponents(node, errorHandler) {
  try {
    switch (node.name) {
    case 'panel':
      _assignPanelId(node);
      break;
    default:
      break;
    }
  } catch (error) {
    if (!errorHandler) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    errorHandler(error);
  }
}


module.exports = {
  parseComponents,
  postParseComponents,
};
