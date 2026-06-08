const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempOutFile = path.resolve(__dirname, 'temp-products.cjs');
const productsFile = path.resolve(__dirname, '../src/app/data/products.ts');
const targetFile = path.resolve(__dirname, '../public/pinterest-feed.xml');

console.log('Compiling products data using esbuild...');
try {
  // Bundle the TypeScript file into a temporary CommonJS file
  execSync(`npx esbuild "${productsFile}" --bundle --format=cjs --platform=node --outfile="${tempOutFile}"`, { stdio: 'inherit' });
  
  // Require the bundled module
  const { featuredProducts } = require(tempOutFile);
  
  if (!featuredProducts || !Array.isArray(featuredProducts)) {
    throw new Error('Could not retrieve featuredProducts array from compiled module.');
  }
  
  console.log(`Successfully imported ${featuredProducts.length} products. Generating XML...`);
  
  // Helper to escape XML special characters
  const escapeXml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>NoirKart Product Catalog</title>\n`;
  xml += `    <link>https://noirkart.com</link>\n`;
  xml += `    <description>Curated Premium Deals on NoirKart</description>\n`;
  
  for (const product of featuredProducts) {
    const title = escapeXml(product.name);
    const description = escapeXml(
      `Buy ${product.name} at ₹${product.price}. Premium ${product.category} curated by NoirKart. Discover verified deals and official merchant links.`
    );
    // Link structure: product.buyLink, fallback to https://noirkart.com/?product=ID
    const link = escapeXml(product.buyLink || `https://noirkart.com/?product=${product.id}`);
    const imageLink = escapeXml(product.image);
    const price = `${product.price} INR`;
    const availability = 'in stock';
    const condition = 'new';
    
    xml += `    <item>\n`;
    xml += `      <g:id>${product.id}</g:id>\n`;
    xml += `      <g:title>${title}</g:title>\n`;
    xml += `      <g:description>${description}</g:description>\n`;
    xml += `      <g:link>${link}</g:link>\n`;
    xml += `      <g:image_link>${imageLink}</g:image_link>\n`;
    xml += `      <g:price>${price}</g:price>\n`;
    xml += `      <g:availability>${availability}</g:availability>\n`;
    xml += `      <g:condition>${condition}</g:condition>\n`;
    xml += `      <g:brand>NoirKart</g:brand>\n`;
    xml += `    </item>\n`;
  }
  
  xml += `  </channel>\n`;
  xml += `</rss>\n`;
  
  // Ensure public directory exists
  const publicDir = path.dirname(targetFile);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(targetFile, xml, 'utf8');
  console.log(`Pinterest Catalog Feed generated successfully at: ${targetFile}`);
  
} catch (error) {
  console.error('Error generating Pinterest feed:', error);
  process.exit(1);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempOutFile)) {
    try {
      fs.unlinkSync(tempOutFile);
    } catch (e) {
      console.warn('Could not delete temporary file:', tempOutFile);
    }
  }
}
