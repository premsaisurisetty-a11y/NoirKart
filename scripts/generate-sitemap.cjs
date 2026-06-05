const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempProductsOutFile = path.resolve(__dirname, 'temp-products.cjs');
const tempArticlesOutFile = path.resolve(__dirname, 'temp-articles.cjs');

const productsFile = path.resolve(__dirname, '../src/app/data/products.ts');
const articlesFile = path.resolve(__dirname, '../src/app/data/articles.ts');
const targetFile = path.resolve(__dirname, '../public/sitemap.xml');

console.log('Compiling products and articles data using esbuild for sitemap...');
try {
  // Bundle products
  execSync(`npx esbuild "${productsFile}" --bundle --format=cjs --platform=node --outfile="${tempProductsOutFile}"`, { stdio: 'ignore' });
  // Bundle articles
  execSync(`npx esbuild "${articlesFile}" --bundle --format=cjs --platform=node --outfile="${tempArticlesOutFile}"`, { stdio: 'ignore' });
  
  // Require the bundled modules
  const { featuredProducts } = require(tempProductsOutFile);
  const { initialArticles } = require(tempArticlesOutFile);
  
  if (!featuredProducts || !Array.isArray(featuredProducts)) {
    throw new Error('Could not retrieve featuredProducts array from compiled module.');
  }
  if (!initialArticles || !Array.isArray(initialArticles)) {
    throw new Error('Could not retrieve initialArticles array from compiled module.');
  }
  
  console.log(`Successfully imported ${featuredProducts.length} products and ${initialArticles.length} blog articles. Generating sitemap...`);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Helper to append a URL
  const appendUrl = (url, changefreq, priority) => {
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;
  };
  
  // Static/Base Pages
  appendUrl('https://noirkart.com/', 'daily', '1.0');
  appendUrl('https://noirkart.com/?page=about', 'monthly', '0.5');
  appendUrl('https://noirkart.com/?page=contact', 'monthly', '0.5');
  appendUrl('https://noirkart.com/?page=privacy', 'monthly', '0.3');
  appendUrl('https://noirkart.com/?page=terms', 'monthly', '0.3');
  appendUrl('https://noirkart.com/?page=affiliate', 'monthly', '0.4');
  appendUrl('https://noirkart.com/?page=blog', 'daily', '0.8');
  appendUrl('https://noirkart.com/products', 'daily', '0.8');
  appendUrl('https://noirkart.com/cart', 'weekly', '0.5');

  // Dynamic Product Pages
  for (const product of featuredProducts) {
    if (product.id) {
      appendUrl(`https://noirkart.com/?product=${product.id}`, 'weekly', '0.7');
    }
  }
  
  // Dynamic Article Review Pages
  for (const article of initialArticles) {
    if (article.id) {
      // Escape the ampersand in the URL for valid XML
      appendUrl(`https://noirkart.com/?page=blog&amp;article=${article.id}`, 'weekly', '0.6');
    }
  }
  
  xml += `</urlset>\n`;
  
  // Ensure public directory exists
  const publicDir = path.dirname(targetFile);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(targetFile, xml, 'utf8');
  console.log(`Sitemap generated successfully at: ${targetFile}`);
  
} catch (error) {
  console.error('Error generating sitemap:', error);
  process.exit(1);
} finally {
  // Clean up temporary files
  if (fs.existsSync(tempProductsOutFile)) {
    try { fs.unlinkSync(tempProductsOutFile); } catch (e) {}
  }
  if (fs.existsSync(tempArticlesOutFile)) {
    try { fs.unlinkSync(tempArticlesOutFile); } catch (e) {}
  }
}
