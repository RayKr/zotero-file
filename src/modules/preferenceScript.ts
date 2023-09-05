/* eslint-disable @typescript-eslint/ban-ts-comment */
import { config, homepage } from "../../package.json";
import { getString } from "../utils/locale";


export function registerPrefs() {
  ztoolkit.PreferencePane.register({
    pluginID: config.addonID,
    src: rootURI + `chrome/content/preferences${Zotero.locale == "zh-CN" ? "_zh-CN" : ""
      }.xhtml`,
    label: "File",
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    // helpURL: homepage,
    defaultXUL: true,
  });
}

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  if (addon.data.prefs?.window == undefined) return;
  const doc = addon.data.prefs?.window.document;
  doc
    .querySelector("#choose-source-dir")
    ?.addEventListener("command", async () => {
      const sourceDir = await new ztoolkit.FilePicker(
        "Select Source Dir",
        "folder",
      ).open();
      if (sourceDir) {
        Zotero.Prefs.set("extensions.zotfile.source_dir", sourceDir, true);
      }
    });
  doc
    .querySelector("#choose-dest-dir")
    ?.addEventListener("command", async () => {
      const destDir = await new ztoolkit.FilePicker(
        "Select Dest Dir",
        "folder",
      ).open();
      if (destDir) {
        Zotero.Prefs.set("extensions.zotfile.dest_dir", destDir, true);
      }
    });

  doc
    .querySelectorAll("radiogroup#zotfile-import radio")
    .forEach((radio: any) => {
      if (
        String(Zotero.Prefs.get("extensions.zotfile.import", true)) ==
        radio.getAttribute("value")
      ) {
        radio.click();
      }
      radio.addEventListener("click", () => {
        Zotero.Prefs.set(
          "extensions.zotfile.import",
          radio.getAttribute("value") == "true",
          true,
        );
      });
    });
}

function bindPrefEvents() {
}
