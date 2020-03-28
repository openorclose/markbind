const cheerio = require('cheerio');
const htmlparser = require('htmlparser2');
const componentParser = require('../../../src/lib/markbind/src/parsers/componentParser');
const testData = require('../utils/componentParserData');

/**
 * Runs the parseComponent or postParseComponent method of componentParser on the provided
 * template, verifying it with the expected result.
 * @param template The html template, which should only have one root element
 * @param expectedTemplate The expected result template
 * @param postParse Boolean of whether to run postParseComponent instead of parseComponent.
 *                  Defaults to false
 */
const expectSuccessfullyParsedTemplate = (template, expectedTemplate, postParse = false) => {
  let parsedHtml = undefined;
  let hasError = false;
  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      hasError = true;
    }

    if (postParse) {
      dom.forEach(node => componentParser.postParseComponents(node));
    } else {
      dom.forEach(node => componentParser.parseComponents(node));
    }
    parsedHtml = cheerio.html(dom);
  });

  const htmlParser = new htmlparser.Parser(handler, {
    xmlMode: true,
    decodeEntities: false,
  });

  htmlParser.parseComplete(template);

  expect(hasError).toBe(false);
  return expect(parsedHtml);
};

test('parseComponent parses panel attributes and inserts into dom as slots correctly', () => {
  console.log(expectSuccessfullyParsedTemplate(testData.PARSE_PANEL_ATTRIBUTES));
  expectSuccessfullyParsedTemplate(testData.PARSE_PANEL_ATTRIBUTES).toMatchInlineSnapshot(testData.PARSE_PANEL_ATTRIBUTES_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_PANEL_HEADER_NO_OVERRIDE).toMatchInlineSnapshot(testData.PARSE_PANEL_HEADER_NO_OVERRIDE_EXPECTED);
});

test('parseComponent parses popover attributes and inserts into dom as slots correctly', async () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_POPOVER_ATTRIBUTES).toMatchInlineSnapshot(testData.PARSE_POPOVER_ATTRIBUTES_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_POPOVER_ATTRIBUTES_NO_OVERRIDE).toMatchInlineSnapshot(testData.PARSE_POPOVER_ATTRIBUTES_NO_OVERRIDE_EXPECTED);

  // todo remove these once 'title' for popover is fully deprecated
  expectSuccessfullyParsedTemplate(testData.PARSE_POPOVER_TITLE).toMatchInlineSnapshot(testData.PARSE_POPOVER_TITLE_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_POPOVER_TITLE_NO_OVERRIDE).toMatchInlineSnapshot(testData.PARSE_POPOVER_TITLE_NO_OVERRIDE_EXPECTED);
});

test('parseComponent parses tooltip attributes and inserts into dom as slots correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_TOOLTIP_CONTENT).toMatchInlineSnapshot(testData.PARSE_TOOLTIP_CONTENT_EXPECTED);
});

test('parseComponent parses modal attributes and inserts into dom as slots correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_MODAL_HEADER).toMatchInlineSnapshot(testData.PARSE_MODAL_HEADER_EXPECTED);

  // todo remove these once 'title' for modals is fully deprecated
  expectSuccessfullyParsedTemplate(testData.PARSE_MODAL_TITLE).toMatchInlineSnapshot(testData.PARSE_MODAL_TITLE_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_MODAL_TITLE_NO_OVERRIDE).toMatchInlineSnapshot(testData.PARSE_MODAL_TITLE_NO_OVERRIDE_EXPECTED);

  // todo remove these once 'modal-header' / 'modal-footer' for modal is fully deprecated
  expectSuccessfullyParsedTemplate(testData.PARSE_MODAL_SLOTS_RENAMING).toMatchInlineSnapshot(testData.PARSE_MODAL_SLOTS_RENAMING_EXPECTED);

  // when the ok-text attr is set, footer shouldn't be disabled and ok-only attr should be added
  expectSuccessfullyParsedTemplate(testData.PARSE_MODAL_OK_TEXT).toMatchInlineSnapshot(testData.PARSE_MODAL_OK_TEXT_EXPECTED);
});

test('parseComponent parses tab & tab-group attributes and inserts into dom as slots correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_TAB_HEADER).toMatchInlineSnapshot(testData.PARSE_TAB_HEADER_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_TAB_GROUP_HEADER).toMatchInlineSnapshot(testData.PARSE_TAB_GROUP_HEADER_EXPECTED);
});

test('parseComponent parses box attributes and inserts into dom as slots correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_BOX_ICON).toMatchInlineSnapshot(testData.PARSE_BOX_ICON_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_BOX_HEADER).toMatchInlineSnapshot(testData.PARSE_BOX_HEADER_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.PARSE_BOX_HEADING).toMatchInlineSnapshot(testData.PARSE_BOX_HEADING_EXPECTED);
});

test('postParseComponent assigns the correct header id to panels', () => {
  expectSuccessfullyParsedTemplate(testData.POST_PARSE_PANEL_ID_ASSIGNED_USING_HEADER_ATTRIBUTE, true).toMatchInlineSnapshot(testData.POST_PARSE_PANEL_ID_ASSIGNED_USING_HEADER_ATTRIBUTE_EXPECTED);
  expectSuccessfullyParsedTemplate(testData.POST_PARSE_PANEL_ID_ASSIGNED_USING_HEADER_SLOT, true).toMatchInlineSnapshot(testData.POST_PARSE_PANEL_ID_ASSIGNED_USING_HEADER_SLOT_EXPECTED);
});

test('parseComponent parses dropdown header attribute and inserts into DOM as _header slot correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_DROPDOWN_HEADER).toMatchInlineSnapshot(testData.PARSE_DROPDOWN_HEADER_EXPECTED);
});

test('parseComponent parses dropdown text attribute and inserts into DOM as _header slot correctly', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_DROPDOWN_TEXT_ATTR).toMatchInlineSnapshot(testData.PARSE_DROPDOWN_TEXT_ATTR_EXPECTED);
});

test('parseComponent parses dropdown with header taking priority over text attribute', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_DROPDOWN_HEADER_SHADOWS_TEXT).toMatchInlineSnapshot(testData.PARSE_DROPDOWN_HEADER_SHADOWS_TEXT_EXPECTED);
});

test('parseComponent parses dropdown with header slot taking priority over header attribute', () => {
  expectSuccessfullyParsedTemplate(testData.PARSE_DROPDOWN_HEADER_SLOT_TAKES_PRIORITY).toMatchInlineSnapshot(testData.PARSE_DROPDOWN_HEADER_SLOT_TAKES_PRIORITY_EXPECTED);
});
