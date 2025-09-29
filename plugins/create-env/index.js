module.exports = {
  onPreBuild: ({ constants, utils }) => {
    const fs = require("fs");
    const apiKey = process.env.GROQ_API_KEY || "";
    const content = `window.env = { GROQ_API_KEY: "${apiKey}" };`;
    fs.writeFileSync(`${constants.PUBLISH_DIR}/env.js`, content);
    console.log("✅ env.js generated with GROQ_API_KEY");
  }
};
