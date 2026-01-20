import * as cheerio from 'cheerio';

const URL = 'https://thepiratebay.org/search.php?q=top100';

async function scrape() {
  // Fetch the page to scrape
  const res = await fetch(URL);
  // Grab raw HTML
  const html = await res.text();

  console.log(html);

  // Parse with Cheerio
  const $ = cheerio.load(html);
  const torrents = [];

  // Get each quote
//   $('.list-item.item-name.item-title').each((_i, el) => {
    // console.log(el);
    // Get quote text and author
    // const text = $(el).find('a').attr('href');
    // const author = $(el).find('.author').text().trim();

    // const tags = [];
    // Get tags
    // $(el)
    //   .find('.tags .tag')
    //   .each((_j, tagEl) => tags.push($(tagEl).text().trim()));

    // Add to the array
    // torrents.push({ el });
//   });

  console.log(JSON.stringify(torrents, null, 2));
}

await scrape();
