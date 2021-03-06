#!/usr/bin/env node

import { DependencyInjection } from "../proxy/dependency.injection";
import { TYPES } from "../proxy/dependency.injection.types";
import { IDebugLogger } from "../util/interfaces/i.debug.logger";
import { IUpstreamProxyConfigurator } from "../util/interfaces/i.upstream.proxy.configurator";
import { IMain } from "../proxy/interfaces/i.main";

import nodeCleanup from "node-cleanup";

const container = new DependencyInjection();
let proxyMain = container.get<IMain>(TYPES.IMain);
let debug = container.get<IDebugLogger>(TYPES.IDebugLogger);
const upstreamProxyConfigurator = container.get<IUpstreamProxyConfigurator>(
  TYPES.IUpstreamProxyConfigurator
);

upstreamProxyConfigurator.processNoProxyLoopback();

(async () => {
  await proxyMain.run(
    false,
    process.env.HTTP_PROXY,
    process.env.HTTPS_PROXY,
    process.env.NO_PROXY
  );
})();

// Unfortunately we can only catch these signals on Mac/Linux,
// Windows gets a hard exit => the portsFile is left behind,
// but will be replaced on next start
nodeCleanup((exitCode, signal) => {
  if (exitCode) {
    debug.log("Detected process exit with code", exitCode);
    // On a non-signal exit, we cannot postpone the process termination.
    // We try to cleanup but cannot be sure that the ports file was deleted.
    proxyMain.stop();
  }
  if (signal) {
    debug.log("Detected termination signal", signal);
    // On signal exit, we postpone the process termination by returning false,
    // to ensure that cleanup has completed.
    (async () => {
      await proxyMain.stop();
      process.kill(process.pid, signal);
    })();
    nodeCleanup.uninstall(); // don't call cleanup handler again
    return false;
  }
});
