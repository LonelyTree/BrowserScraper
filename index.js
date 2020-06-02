const puppeteer = require('puppeteer')
const chalk = require('chalk')

;(async () => {
	let myFault = chalk.yellow.inverse.bold(
		'===========================' +
			'\n         MY ERROR          ' +
			'\n===========================\n'
	)
	const companyPath =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div:nth-child(1) > field-formatter > blob-formatter > span'
	const founderPath =
		'#section-overview > mat-card > div.section-layout-content > fields-card:nth-child(3) > div > span:nth-child(8) > field-formatter > identifier-multi-formatter > span > a'
	const founderTitlePath =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div:nth-child(2) > field-formatter > span'
	const currentlyWorksHere =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div:nth-child(3) > field-formatter > identifier-formatter > a > div > div'
	const previousTitle =
		'#section-jobs > mat-card > div.section-layout-content > list-card > div > table > tbody > tr'
	const selectorPath =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div > field-formatter > blob-formatter > span'
	const contactPath =
		'#section-overview > mat-card > div.section-layout-content > fields-card:nth-child(4) > div > span'

	let objectResult = {}

	await puppeteer.defaultArgs(['--disable-web-security'])
	const browser = await puppeteer.launch({ headless: false })
	const page = await browser.newPage()
	const newTab = await browser.newPage()
	page.setUserAgent(
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.21 Safari/537.36'
	)
	try {
		const navigationPromise = page.waitForNavigation()
		await page.goto('https://www.crunchbase.com/organization/bloveit')
		await page.setViewport({ width: 1680, height: 891 })
		await navigationPromise
		await page.waitFor(500)
		/*   FIND COMPANY NAME   */
		const companyHolder = await page.$(companyPath)
		let name = await page.evaluate((x) => {
			return x.innerText
		}, companyHolder)

		objectResult['company'] = name
		objectResult['founders'] = []
		/*   FIND FOUNDER   */
		const founderHolder = await page.$$(founderPath)
		for (const founder of founderHolder) {
			let url = await page.evaluate((x) => {
				return x.href
			}, founder)
			const newTabNavigationPromise = newTab.waitForNavigation()
			await newTab.goto(url)
			await newTabNavigationPromise
			await newTab.waitFor(1000)

			/*   GET FOUNDER NAME & TITLE  */
			let name = await newTab.$eval(selectorPath, (span) => span.innerText)
			await newTabNavigationPromise
			/*   GET SOCIAL MEDIA LINKS   */
			let socialMedia = await newTab.$$(contactPath)
			let linkList = []
			for (const links of socialMedia) {
				const link = await links.$('a')
				if (link) {
					const websiteName = await link.evaluate((x) =>
						x.getAttribute('title')
					)
					const websiteLink = await link.evaluate((x) => x.getAttribute('href'))
					const websiteNameClean = websiteName.replace('View on ', '')
					linkList.push({ [websiteNameClean]: websiteLink })
				}
			}
			objectResult.founders.push({ name, links: linkList })
		}
		console.log(objectResult)
		// await newTab.close()
		// await page.close()
		// await browser.close()
	} catch (e) {
		console.log(myFault, e)
		// await newTab.close()
		// await page.close()
		// await browser.close()
	}
})()

// USEFUL CODE

// V-- GETS LINKS AND RETURNS AN ARRAY TO CONSOLE
// const navigatePage = await page.$("a[href^='https://linex.com']")
// let linkArr = []
// let link = await page.evaluate((x) => {
// 	return x.href
// }, navigatePage)
// await linkArr.push(link)
// await console.log(linkArr)
