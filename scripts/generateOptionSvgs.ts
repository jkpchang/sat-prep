/**
 * Script to generate SVG for answer options from LaTeX formulas
 * 
 * Usage:
 *   npm run generate-option-svgs "-4/3" "-1/3" "1/3" "4/3"
 *   npm run generate-option-svgs "\\frac{-4}{3}" "\\frac{-1}{3}" "\\frac{1}{3}" "\\frac{4}{3}"
 * 
 * The script will output an array of SVG strings that can be copied into optionsSvg in questions.ts
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
 * Convert a simple fraction string to LaTeX format
 * e.g., "-4/3" -> "\\frac{-4}{3}"
 */
function convertToLatex(option: string): string {
  // If it already contains LaTeX commands, return as-is
  if (option.includes("\\") || option.includes("^{") || option.includes("_{")) {
    return option;
  }

  // Handle negative fractions like "-4/3"
  const negativeMatch = option.match(/^-(\d+)\/(\d+)$/);
  if (negativeMatch) {
    return `\\frac{-${negativeMatch[1]}}{${negativeMatch[2]}}`;
  }

  // Handle positive fractions like "4/3"
  const fractionMatch = option.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return `\\frac{${fractionMatch[1]}}{${fractionMatch[2]}}`;
  }

  // Handle negative numbers like "-3"
  if (option.startsWith("-") && /^-?\d+$/.test(option)) {
    return option; // Already in LaTeX format
  }

  // For other cases, return as-is (might be a number or already LaTeX)
  return option;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run generate-option-svgs <option1> [option2] ...");
    console.log("Example: npm run generate-option-svgs \"-4/3\" \"-1/3\" \"1/3\" \"4/3\"");
    console.log("\nThe script will automatically convert simple fractions to LaTeX format.");
    console.log("You can also provide LaTeX directly: \"\\\\frac{-4}{3}\"");
    process.exit(1);
  }

  console.log(`Generating SVG for ${args.length} option(s)...\n`);

  const svgResults: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const option = args[i];
    const latexFormula = convertToLatex(option);
    
    console.log(`[${i + 1}/${args.length}] Option: "${option}"`);
    if (latexFormula !== option) {
      console.log(`   Converted to LaTeX: ${latexFormula}`);
    }
    
    try {
      const svg = await generateSvgFromLatex(latexFormula);
      const formattedSvg = formatSvgForTypeScript(svg);
      svgResults.push(formattedSvg);
      
      console.log("   ✅ Generated\n");
      
      // Small delay to avoid rate limiting
      if (i < args.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`   ❌ Failed to generate SVG for option "${option}"`);
      if (error instanceof Error) {
        console.error(`      Error: ${error.message}`);
      }
      // Add empty string to maintain array length
      svgResults.push("");
    }
  }

  console.log("─".repeat(80));
  console.log("✅ All SVGs generated!");
  console.log("\nCopy the array below into optionsSvg in questions.ts:\n");
  console.log("optionsSvg: [");
  svgResults.forEach((svg, index) => {
    const comma = index < svgResults.length - 1 ? "," : "";
    console.log(`  "${svg}"${comma}`);
  });
  console.log("],");
  console.log("\n✅ Done!");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

