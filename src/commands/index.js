'use strict';

/// <reference types="cypress" />

const ConfigValidator = require('../util/config.validator').ConfigValidator;
const SsoConfigValidator = require('../util/sso.config.validator').SsoConfigValidator;

/**
 * Adds NTLM authentication support to Cypress for a specific host.
 * You can call this multiple times to register several hosts or
 * change credentials.
 * @example
 ```js
  cy.ntlm('https://ntlm.acme.com', 'TheUser', 'ThePassword', 'TheDomain');
 ```
 */
const ntlm = (ntlmHost, username, password, domain, workstation, ntlmVersion) => {
  const log = {
    name: 'ntlm',
    message: { ntlmHost, username }
  };

  const ntlmProxy = Cypress.env('NTLM_AUTH_PROXY');
  const ntlmConfigApi = Cypress.env('NTLM_AUTH_API');
  if (!ntlmProxy || !ntlmConfigApi) {
    throw new Error('The cypress-ntlm-auth plugin must be loaded before using this method');
  }

  let ntlmConfig = {
    ntlmHost: ntlmHost,
    username: username,
    password: password,
    domain: domain,
    workstation: workstation,
    ntlmVersion: ntlmVersion || 2
  };
  let validationResult = ConfigValidator.validate(ntlmConfig);
  if (!validationResult.ok) {
    throw new Error(validationResult.message);
  }

  let result;
  cy.request({
    method: 'POST',
    url: ntlmConfigApi + '/ntlm-config',
    body: ntlmConfig,
    log: false // This isn't communication with the test object, so don't show it in the test log
  }).then((resp) => {
    if (resp.status === 200) {
      result = 'Enabled NTLM authentication for host ' + ntlmHost;
    } else {
      result = 'failed';
      throw new Error('Could not configure cypress-ntlm-auth plugin. Error returned: "' + resp.body + '"');
    }
  });

  log.consoleProps = () => {
    return {
      ntlmHost: ntlmHost,
      username: username,
      domain: domain,
      workstation: workstation,
      ntlmVersion: ntlmVersion || 2,
      result: result
    };
  };

  Cypress.log(log);
};

/**
 * Adds NTLM Single-sign-on authentication support to Cypress for
 * specific hosts. Wildcards are supported.
 * Calling this multiple times replaces previous SSO configuration.
 * @example
 ```js
  cy.ntlmSso(['ntlm.acme.com', '*.internal.acme.com');
 ```
 */
const ntlmSso = (ntlmHosts) => {
  const log = {
      name: 'ntlmSso',
      message: { ntlmHosts }
  };
  const ntlmProxy = Cypress.env('NTLM_AUTH_PROXY');
  const ntlmConfigApi = Cypress.env('NTLM_AUTH_API');
  if (!ntlmProxy || !ntlmConfigApi) {
      throw new Error('The cypress-ntlm-auth plugin must be loaded before using this method');
  }

  let ntlmSsoConfig = {
    ntlmHosts: ntlmHosts
  };
  let validationResult = SsoConfigValidator.validate(ntlmSsoConfig);
  if (!validationResult.ok) {
    throw new Error(validationResult.message);
  }

  let result;
  cy.request({
      method: 'POST',
      url: ntlmConfigApi + '/ntlm-sso',
      body: ntlmSsoConfig,
      log: false // This isn't communication with the test object, so don't show it in the test log
  }).then((resp) => {
      if (resp.status === 200) {
          result = 'Enabled NTLM SSO authentication for hosts';
      }
      else {
          result = 'failed';
          throw new Error('Could not configure cypress-ntlm-auth plugin. Error returned: "' + resp.body + '"');
      }
  });
  log.consoleProps = () => {
      return {
          ntlmSsoConfig: ntlmSsoConfig,
          result: result
      };
  };
  Cypress.log(log);
};

/**
 * Reset NTLM authentication for all configured hosts. Recommended before/after tests.
 * @example
 ```js
  cy.ntlmReset();
 ```
 */
const ntlmReset = () => {
  const log = {
    name: 'ntlmReset',
    message: {}
  };

  const ntlmProxy = Cypress.env('NTLM_AUTH_PROXY');
  const ntlmConfigApi = Cypress.env('NTLM_AUTH_API');
  if (!ntlmProxy || !ntlmConfigApi) {
    throw new Error('The cypress-ntlm-auth plugin must be loaded before using this method');
  }

  let result;

  cy.request({
    method: 'POST',
    url: ntlmConfigApi + '/reset',
    body: {},
    log: false // This isn't communication with the test object, so don't show it in the test log
  }).then((resp) => {
    if (resp.status === 200) {
      result = 'NTLM authentication reset OK, no hosts configured';
    } else {
      result = 'failed';
      throw new Error('Could not reset cypress-ntlm-auth plugin. Error returned: "' + resp.body + '"');
    }
  });

  log.consoleProps = () => {
    return {
      result: result
    };
  };

  Cypress.log(log);
};

Cypress.Commands.add('ntlm', { prevSubject: false }, ntlm);
Cypress.Commands.add('ntlmSso', { prevSubject: false }, ntlmSso);
Cypress.Commands.add('ntlmReset', { prevSubject: false }, ntlmReset);
