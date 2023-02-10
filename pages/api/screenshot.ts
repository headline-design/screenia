import type { NextApiRequest, NextApiResponse } from "next";
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const exePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function getOptions() {
  const env = process.env.NODE_ENV;
  let options;
  if (env == "development") {
    options = {
      args: [],
      executablePath: exePath,
      headless: true,
    };
  } else {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
      ignoreDefaultArgs: ["--disable-extensions"],
      ignoreHTTPSErrors: true,
    };
  }
  return options;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { url, type = "png", download = false } = req.query;

  const outPut = { type };

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  const options = await getOptions();
  let browser;
  try {
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto(url as string, {
      timeout: 15 * 1000,
    });
    await page.waitForTimeout(2000);
    const screenshot = await page.screenshot(outPut);
    if (download) {
      res.status(200).send(screenshot);
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", `image/${type}`);
      res.end(screenshot);
    }
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
