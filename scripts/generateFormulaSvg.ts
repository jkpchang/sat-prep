/**
 * Script to generate SVG from LaTeX formulas using CodeCogs API
 * 
 * Usage:
 *   npm run generate-formula-svg "\\frac{x}{x+1} = 4"
 *   npm run generate-formula-svg "\\frac{x}{x+1} = 4" "\\frac{2^{x}}{4^{x}} = \\frac{1}{8}"
 * 
 * The script will output the SVG strings that can be copied into questions.ts
 */

const CODECOGS_API_URL = "https://latex.codecogs.com/svg.latex?";

/**
 * Encode a LaTeX formula for URL
 */
function encodeFormula(formula: string): string {
  return encodeURIComponent(formula);
}

/**
 * Generate SVG from LaTeX formula using CodeCogs API
 */
async function generateSvgFromLatex(formula: string): Promise<string> {
  const encodedFormula = encodeFormula(formula);
  const url = `${CODECOGS_API_URL}${encodedFormula}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const svg = await response.text();
    return svg;
  } catch (error) {
    console.error(`Error generating SVG for formula "${formula}":`, error);
    throw error;
  }
}

/**
 * Format SVG string for use in TypeScript (escape quotes, handle newlines)
 */
function formatSvgForTypeScript(svg: string): string {
  // Remove XML declaration and comments
  let cleaned = svg
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Replace xlink:href with href for modern SVG
    .replace(/xlink:href/g, "href")
    // Remove newlines and extra whitespace
    .replace(/\s+/g, " ")
    // Escape single quotes
    .replace(/'/g, "\\'")
    .trim();
  
  return cleaned;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run generate-formula-svg <formula1> [formula2] ...");
    console.log("Example: npm run generate-formula-svg \"\\\\frac{x}{x+1} = 4\"");
    console.log("\nNote: Use double backslashes for LaTeX commands in the command line.");
    process.exit(1);
  }

  console.log(`Generating SVG for ${args.length} formula(s)...\n`);

  for (let i = 0; i < args.length; i++) {
    const formula = args[i];
    console.log(`[${i + 1}/${args.length}] Formula: ${formula}`);
    
    try {
      const svg = await generateSvgFromLatex(formula);
      const formattedSvg = formatSvgForTypeScript(svg);
      
      console.log("\n✅ Generated SVG:");
      console.log("─".repeat(80));
      console.log(formattedSvg);
      console.log("─".repeat(80));
      console.log("\nCopy the SVG string above and paste it into the imageSvg field in questions.ts\n");
      
      // Small delay to avoid rate limiting
      if (i < args.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Failed to generate SVG for formula "${formula}"`);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
    }
  }

  console.log("✅ Done!");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

