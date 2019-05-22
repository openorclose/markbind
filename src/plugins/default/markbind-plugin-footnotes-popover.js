const cheerio = module.parent.require('cheerio');

module.exports = {
  postRender: (content) => {
    const $ = cheerio.load(content, { xmlMode: false });
    let string = '';
    $('li.footnote-item').each(function () {
      const id = `pop:${this.attribs.id}`;
      string += (`<popover id = "${id}"><span slot = "content"><trigger for = "${id}" keeporiginalstyle>
        ${$(this).find('p').html()}
    </trigger></span></popover>`);
    });
    return $.html() + string;
  },
};
