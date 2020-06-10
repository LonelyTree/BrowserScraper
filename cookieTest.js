const chrome = require('chrome-cookies-secure')
const puppeteer = require('puppeteer')

const url = 'https://www.crunchbase.com/'

const getCookies = (callback) => {
	chrome.getCookies(
		url,
		'puppeteer',
		function (err, cookies) {
			if (err) {
				console.log(err, 'error')
				return
			}
			console.log(cookies, 'cookies')
			callback(cookies)
		},
		'Default'
	)
}

getCookies(async (cookies) => {
	const browser = await puppeteer.launch({
		headless: false,
	})
	const page = await browser.newPage()

	await page.setCookie(...cookies)
	await page.goto(url)
	await page.waitFor(1000)
	browser.close()
})
