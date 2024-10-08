import puppeteer from "puppeteer";
import fs from "fs";
import nodemailer from "nodemailer";
import readline from "readline";

const REAL_URL =
	"https://rpmca036.appfolio.com/listings?1707155814165&theme_color=%23676767&filters%5Border_by%5D=date_posted&iframe_id=af_iframe_0";
const CALWEST_URL =
	"https://californiawestinc.appfolio.com/listings?1707160133129&theme_color=%23676767&filters%5Border_by%5D=date_posted";
const REG_URL =
	"https://regpm.appfolio.com/listings?1707160374612&theme_color=%23676767&filters%5Border_by%5D=date_posted";
const HAVEN_URL = "https://havenslopm.appfolio.com/listings/";
const SANLUISMGMT_URL = "https://sanluispropmgmt.appfolio.com/listings/";
const SLORENT_URL = "https://frago.appfolio.com/listings/";

const urls = [
	CALWEST_URL,
	REAL_URL,
	REG_URL,
	HAVEN_URL,
	SANLUISMGMT_URL,
	SLORENT_URL,
];

while (1) {
	console.log("Starting scrape");
	let emailContents = "";
	for (let i = 0; i < urls.length; i++) {
		let listings = await scrape(urls[i]);
		if (listings.length > 0) {
			emailContents += urls[i] + "\n";
			emailContents += listings;
		}
	}
	if (emailContents.length > 0) {
		const mailer = getMailer();
		const mailDetails = {
			from: "eberber01@gmail.com",
			to: "eberber01@gmail.com, tony.avina2024@gmail.com",
			subject: "New Listings",
			text: emailContents,
		};
		mailer.sendMail(mailDetails, (err, data) => {
			if (err) {
				console.log(err);
			} else {
				console.log("Email sent successfully");
			}
		});
	}
	await sleep(300000);
}

const scrape = async (url) => {
	const browser = await puppeteer.launch({ headless: "new" });

	const page = await browser.newPage();
	await page.goto(url);

	const elements = await page.evaluate(() => {
		const items = document.querySelectorAll(".js-listing-address");

		return Array.from(items).map((item) => item.textContent);
	});

	browser.close();
	const currentListings = await readListings("listings.txt");

	let newListings = [];
	for (let i = 0; i < elements.length; i++) {
		if (!currentListings.has(elements[i])) {
			newListings.push(elements[i]);
		}
	}

	let listings = newListings.join("\n");
	if (listings.length > 0) {
		listings += "\n";
		fs.appendFile("listings.txt", listings, function (err) {
			if (err) {
				return console.log(err);
			}
		});
	}
	return listings;
};

const getMailer = () => {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "eberber01@gmail.com",
			pass: "",
		},
	});
};

const readListings = async (filePath) => {
	const linesSet = new Set();
	const fileStream = fs.createReadStream(filePath);

	// Create an interface for reading lines from the stream
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity, // To handle both \r\n and \n line endings
	});

	for await (const line of rl) {
		linesSet.add(line);
	}

	rl.close();
	return linesSet;
};

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
