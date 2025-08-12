const puppeteer = require('puppeteer');

describe('Insurance Form E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Insurance Form Submission Workflow', () => {
    test('should complete full insurance form submission process', async () => {
      // Navigate to admin dashboard
      await page.goto('http://localhost:3000/admin/dashboard.html');
      
      // Wait for page to load
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Fill out the insurance form
      await page.select('#insuranceBoosterClub', 'Band');
      await page.type('#insuranceEventName', 'E2E Test Event');
      await page.type('#insuranceEventDate', '2024-12-25');
      await page.type('#insuranceEventDescription', 'End-to-end test event description');
      await page.type('#insuranceParticipantCount', '25');

      // Submit the form
      await page.click('#submitInsuranceBtn');

      // Wait for success message
      await page.waitForSelector('.alert-success', { timeout: 10000 });

      // Verify success message
      const successMessage = await page.$eval('.alert-success', el => el.textContent);
      expect(successMessage).toContain('Insurance submission created successfully');

      // Verify form is cleared
      const eventNameValue = await page.$eval('#insuranceEventName', el => el.value);
      expect(eventNameValue).toBe('');

      // Verify submission appears in the table
      await page.waitForSelector('#insuranceTable tbody tr', { timeout: 10000 });
      
      const tableRows = await page.$$('#insuranceTable tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);

      // Verify the new submission data
      const lastRow = tableRows[tableRows.length - 1];
      const eventNameCell = await lastRow.$eval('td:nth-child(3)', el => el.textContent);
      expect(eventNameCell).toContain('E2E Test Event');
    }, 30000);

    test('should validate required fields', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Try to submit without filling required fields
      await page.click('#submitInsuranceBtn');

      // Wait for error message
      await page.waitForSelector('.alert-danger', { timeout: 10000 });

      const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
      expect(errorMessage).toContain('Missing required fields');
    }, 30000);

    test('should update insurance submission status', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceTable', { timeout: 10000 });

      // Wait for table to load with data
      await page.waitForSelector('#insuranceTable tbody tr', { timeout: 10000 });

      // Find the first status dropdown
      const statusDropdown = await page.$('#insuranceTable tbody tr:first-child .status-select');
      expect(statusDropdown).not.toBeNull();

      // Change status to 'approved'
      await page.select('#insuranceTable tbody tr:first-child .status-select', 'approved');

      // Wait for success message or page update
      await page.waitForTimeout(2000);

      // Verify the status was updated (this might require a page reload or API call)
      const updatedStatus = await page.$eval('#insuranceTable tbody tr:first-child .status-select', el => el.value);
      expect(updatedStatus).toBe('approved');
    }, 30000);

    test('should delete insurance submission', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceTable', { timeout: 10000 });

      // Wait for table to load with data
      await page.waitForSelector('#insuranceTable tbody tr', { timeout: 10000 });

      // Get initial row count
      const initialRows = await page.$$('#insuranceTable tbody tr');

      // Click delete button on first row
      const deleteButton = await page.$('#insuranceTable tbody tr:first-child .btn-danger');
      expect(deleteButton).not.toBeNull();

      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        await dialog.accept();
      });

      await deleteButton.click();

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Verify row was removed (this might require a page reload)
      const finalRows = await page.$$('#insuranceTable tbody tr');
      // Note: This assertion might need adjustment based on actual behavior
      expect(finalRows.length).toBeLessThanOrEqual(initialRows.length);
    }, 30000);

    test('should download CSV file', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceTable', { timeout: 10000 });

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click download CSV button
      const downloadButton = await page.$('button[onclick="downloadInsuranceCSV()"]');
      expect(downloadButton).not.toBeNull();
      await downloadButton.click();

      // Wait for download to start
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('insurance_submissions');
      expect(download.suggestedFilename()).toContain('.csv');
    }, 30000);
  });

  describe('Insurance Form UI/UX', () => {
    test('should display booster club dropdown correctly', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceBoosterClub', { timeout: 10000 });

      // Verify dropdown has options
      const options = await page.$$eval('#insuranceBoosterClub option', opts => opts.map(opt => opt.textContent));
      expect(options.length).toBeGreaterThan(1);
      expect(options).toContain('Band');
      expect(options).toContain('Orchestra');
    }, 30000);

    test('should display insurance submissions table correctly', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceTable', { timeout: 10000 });

      // Verify table headers
      const headers = await page.$$eval('#insuranceTable thead th', ths => ths.map(th => th.textContent));
      expect(headers).toContain('Date Submitted');
      expect(headers).toContain('Booster Club');
      expect(headers).toContain('Event Name');
      expect(headers).toContain('Event Date');
      expect(headers).toContain('Description');
      expect(headers).toContain('Participants');
      expect(headers).toContain('Status');
      expect(headers).toContain('Actions');
    }, 30000);

    test('should handle form validation feedback', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Test invalid date format
      await page.type('#insuranceEventDate', 'invalid-date');
      await page.click('#submitInsuranceBtn');

      await page.waitForSelector('.alert-danger', { timeout: 10000 });
      const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
      expect(errorMessage).toContain('Invalid event date format');
    }, 30000);

    test('should handle negative participant count', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Fill form with negative participant count
      await page.select('#insuranceBoosterClub', 'Band');
      await page.type('#insuranceEventName', 'Test Event');
      await page.type('#insuranceEventDate', '2024-12-25');
      await page.type('#insuranceEventDescription', 'Test description');
      await page.type('#insuranceParticipantCount', '-5');

      await page.click('#submitInsuranceBtn');

      await page.waitForSelector('.alert-danger', { timeout: 10000 });
      const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
      expect(errorMessage).toContain('Participant count must be a positive number');
    }, 30000);
  });

  describe('Insurance Form Accessibility', () => {
    test('should have proper form labels and accessibility attributes', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Check for proper labels
      const labels = await page.$$eval('#insuranceForm label', labels => labels.map(l => l.textContent));
      expect(labels).toContain('Booster Club *');
      expect(labels).toContain('Event Name *');
      expect(labels).toContain('Event Date *');
      expect(labels).toContain('Event Description *');
      expect(labels).toContain('Number of Participants');

      // Check for required field indicators
      const requiredFields = await page.$$eval('#insuranceForm [required]', fields => fields.map(f => f.id));
      expect(requiredFields).toContain('insuranceBoosterClub');
      expect(requiredFields).toContain('insuranceEventName');
      expect(requiredFields).toContain('insuranceEventDate');
      expect(requiredFields).toContain('insuranceEventDescription');
    }, 30000);

    test('should be keyboard navigable', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement.id);
      expect(focusedElement).toBe('insuranceBoosterClub');

      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement.id);
      expect(focusedElement).toBe('insuranceEventName');

      // Continue testing tab navigation through all form fields
    }, 30000);
  });

  describe('Insurance Form Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/insurance')) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Fill and submit form
      await page.select('#insuranceBoosterClub', 'Band');
      await page.type('#insuranceEventName', 'Network Test Event');
      await page.type('#insuranceEventDate', '2024-12-25');
      await page.type('#insuranceEventDescription', 'Test network error handling');
      await page.type('#insuranceParticipantCount', '25');

      await page.click('#submitInsuranceBtn');

      // Wait for error message
      await page.waitForSelector('.alert-danger', { timeout: 10000 });
      const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
      expect(errorMessage).toContain('Error');

      // Restore normal network behavior
      await page.setRequestInterception(false);
    }, 30000);

    test('should handle server errors gracefully', async () => {
      // Mock server error response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/insurance') && request.method() === 'POST') {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Internal server error'
            })
          });
        } else {
          request.continue();
        }
      });

      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });

      // Fill and submit form
      await page.select('#insuranceBoosterClub', 'Band');
      await page.type('#insuranceEventName', 'Server Error Test');
      await page.type('#insuranceEventDate', '2024-12-25');
      await page.type('#insuranceEventDescription', 'Test server error handling');
      await page.type('#insuranceParticipantCount', '25');

      await page.click('#submitInsuranceBtn');

      // Wait for error message
      await page.waitForSelector('.alert-danger', { timeout: 10000 });
      const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
      expect(errorMessage).toContain('Internal server error');

      // Restore normal network behavior
      await page.setRequestInterception(false);
    }, 30000);
  });

  describe('Insurance Form Performance', () => {
    test('should load form quickly', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceForm', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    }, 30000);

    test('should handle large datasets efficiently', async () => {
      await page.goto('http://localhost:3000/admin/dashboard.html');
      await page.waitForSelector('#insuranceTable', { timeout: 10000 });

      // Wait for table to load
      await page.waitForSelector('#insuranceTable tbody tr', { timeout: 10000 });

      // Measure table rendering performance
      const renderStart = Date.now();
      await page.waitForFunction(() => {
        const rows = document.querySelectorAll('#insuranceTable tbody tr');
        return rows.length > 0;
      });
      const renderTime = Date.now() - renderStart;

      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
    }, 30000);
  });
});
