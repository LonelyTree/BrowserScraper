const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// const chrome = require('chrome-cookies-secure')
const fs = require('fs')
const chalk = require('chalk')
const { companies } = require('./rawInfo')
const IP_ADDRESS = require('./IPAddresses')

;(async () => {
	let myFault = chalk.yellow.inverse.bold(
		'===========================' +
			'\n            ERROR          ' +
			'\n===========================\n'
	)
	let updated = chalk.blue.inverse.bold(
		'===========================' +
			'\n       FILE UPDATED!!      ' +
			'\n===========================\n'
	)
	let finished = chalk.green.inverse.bold(
		'===========================' +
			'\n      FILE COMPLETE!!      ' +
			'\n===========================\n'
	)
	let brokenLink = chalk.magenta.inverse.bold(
		'===========================' +
			'\n   BROKEN LINK RECORDED    ' +
			'\n===========================\n'
	)

	const companyPath =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div:nth-child(1) > field-formatter > blob-formatter > span'
	const alternateCompanyPath =
		'body > chrome > div > mat-sidenav-container > mat-sidenav-content > div > ng-component > entity-v2 > page-layout > div > div > entity-page-header > div > header > div > div > div.identifier-nav > div.identifier-nav-title.ng-star-inserted > h1 > span'
	const founderPath =
		'#section-overview > mat-card > div.section-layout-content > fields-card:nth-child(3) > ul > li:nth-child(4) > field-formatter > identifier-multi-formatter > span > a'
	const alternateFounderPath =
		'#section-overview > mat-card > div.section-layout-content > fields-card:nth-child(2) > ul > li:nth-child(6) > field-formatter > identifier-multi-formatter > span > a'
	const secondAltFounderPath =
		'#section-overview > mat-card > div.section-layout-content > fields-card:nth-child(3) > ul > li:nth-child(3) > field-formatter > identifier-multi-formatter > span > a'
	const selectorPath =
		'#section-overview > mat-card > div.section-layout-content > image-with-fields-card > image-with-text-card > div > div > div.flex.layout-column.layout-align-center-center.layout-align-gt-sm-center-start.text-content > div > field-formatter > blob-formatter > span'

	await puppeteer.use(StealthPlugin())
	const preloadFile = fs.readFileSync('./preload.js', 'utf8')
	let finalOutput = []

	/* Iterate through company HTMLs */
	main: for (const company of companies) {
		console.log('GETTING NEW COMPANY')

		/* Set random IP address */
		ipAddress = IP_ADDRESS[Math.floor(Math.random() * 100)]

		/* MAKE UNDETECTABLE */
		const args = [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-infobars',
			'--ignore-certifcate-errors',
			'--ignore-certifcate-errors-spki-list',
			`--proxy-server=http=${ipAddress}`,
		]
		const options = {
			args,
			headless: true,
			ignoreHTTPSErrors: true,
			userDataDir: './tmp',
			sloMo: 30,
			defaultViewport: null,
			executablePath:
				'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		}

		/* Start */
		let error404 = false
		const browser = await puppeteer.launch(options)
		const context = await browser.createIncognitoBrowserContext()

		/* Create Page */
		const page = await context.newPage()
		await page.setBypassCSP(true)
		await page.setViewport({ width: 1680, height: 891 })
		await page.setJavaScriptEnabled(true)
		await page.evaluateOnNewDocument(preloadFile)
		await page.setUserAgent(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4158.4 Safari/537.36'
		)
		const navigationPromise = page.waitForNavigation()
		await page.waitFor(Math.floor(Math.random() * 3000) + 1000)
		await page.goto(company)
		await navigationPromise
		await page.on('response', async (response) => {
			if (response.status() === 404) {
				error404 = true
				console.log('ERROR')
				finalOutput.push({
					CompanyURL: company,
					Name: 'Broken URL',
					Company: 'Broken URL',
				})
				fs.writeFile('MAINOUTPUT.json', JSON.stringify(finalOutput), function (
					err
				) {
					if (err) throw err
					console.log(brokenLink)
				})
				await browser.close()
			}
		})
		try {
			if (error404) continue main
			await navigationPromise
			await page.waitFor(Math.floor(Math.random() * 3000) + 1000)
			/*   FIND COMPANY NAME   */
			const companyHolder = await page.$(companyPath)
			const altCompanyHolder = await page.$(alternateCompanyPath)
			let name
			if (companyHolder) {
				name = await page.evaluate((x) => {
					return x.innerText
				}, companyHolder)
			} else {
				name = await page.evaluate((x) => {
					return x.innerText
				}, altCompanyHolder)
			}

			await page.waitFor(Math.floor(Math.random() * 3000) + 1000)
			let companyName = name
			let companyURL = company

			await page.waitFor(Math.floor(Math.random() * 3000) + 1000)

			/*   FIND FOUNDER   */
			const founderArr = await page.$$(founderPath)
			const altFounderArr = await page.$$(alternateFounderPath)
			const secAltFounderArr = await page.$$(secondAltFounderPath)
			let founderHolder
			if (founderArr && founderArr.length != 0) {
				founderHolder = founderArr
			} else if (altFounderArr && altFounderArr.length != 0) {
				founderHolder = altFounderArr
			} else {
				founderHolder = secAltFounderArr
			}
			for (const founder of founderHolder) {
				let url = await page.evaluate((x) => {
					return x.href
				}, founder)
				console.log('FINDING FOUNDER')
				/* Create NewTab */
				const newTab = await context.newPage()
				await newTab.evaluateOnNewDocument(preloadFile)
				const newTabNavigationPromise = newTab.waitForNavigation()
				await newTab.goto(url)
				await newTabNavigationPromise
				await newTab.waitFor(Math.floor(Math.random() * 3000) + 1500)

				/*   GET FOUNDER NAME & TITLE  */
				let founderName = await newTab.$eval(
					selectorPath,
					(span) => span.innerText
				)

				/* Form contact object */
				let contact = {
					Name: founderName,
					Company: companyName,
					CompanyURL: companyURL,
				}
				await newTabNavigationPromise
				await newTab.waitFor(Math.floor(Math.random() * 3000) + 1500)
				/*   GET SOCIAL MEDIA LINKS   */
				let socialMedia
				const correctSocialMediaPath = await newTab.$x(
					'//link-formatter[contains(., a)]'
				)
				console.log(`FOUND ${correctSocialMediaPath.length} CONTACT LINKS.`)

				if (correctSocialMediaPath) {
					socialMedia = correctSocialMediaPath
				}
				for (const links of socialMedia) {
					console.log('GETTING LINKS')
					await newTab.waitFor(Math.floor(Math.random() * 3000) + 1500)
					const link = await links.$('a')
					if (link) {
						const websiteName = await link.evaluate((x) => x.title)
						const websiteLink = await link.evaluate((x) => x.href)
						await newTab.waitFor(Math.floor(Math.random() * 3000) + 1500)
						const websiteNameClean = websiteName.replace('View on ', '')
						if (
							websiteNameClean.endsWith('.com') ||
							websiteNameClean.endsWith('/') ||
							websiteNameClean.endsWith('.*')
						) {
							contact[Custom] = websiteLink
						} else {
							contact[[websiteNameClean]] = websiteLink
						}
					}
				}
				finalOutput.push(contact)
				console.log('FOUNDER PUSHED')
				fs.writeFile('MAINOUTPUT.json', JSON.stringify(finalOutput), function (
					err
				) {
					if (err) throw err
					console.log(updated)
				})
				console.log(finalOutput)
				await newTab.waitFor(Math.floor(Math.random() * 3000) + 1500)
				await newTab.close()
			}
			await page.close()
			await context.close()
			await browser.close()
			fs.appendFile('USED.js', `'${[company]}',\n`, function (err) {
				if (err) throw err
				console.log('Updated USED.js!')
			})
		} catch (e) {
			console.log(myFault, e)
		}
	}
	console.log(finished)
})()
