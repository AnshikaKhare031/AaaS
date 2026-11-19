const path = require("path");
const jiti = require("jiti")(__dirname, {
  alias: {
    "@": path.resolve(__dirname, ".."),
  },
});
jiti("./test-webhook-events-logging.ts");
