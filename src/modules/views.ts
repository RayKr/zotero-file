/* eslint-disable @typescript-eslint/ban-ts-comment */
import { config } from "../../package.json";
export default class Views {
  constructor() { }

  public async init() {
    await this.registerItemMenu();
  }

  private async registerItemMenu() {
    // Attach New Collection Item from File
    ztoolkit.Menu.register("collection", {
      tag: "menuitem",
      id: "id-zotfile-attach-file",
      label:
        Zotero.locale == "zh-CN"
          ? "添加新文件到当前分类"
          : "Attach New Collection Item",
      commandListener: (ev) => Zotero.ZotFile.attachFileToCollection(),
      icon: `chrome://${config.addonRef}/content/icons/attachNewFile.png`,
    });
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
    });
    // Attach New File
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "id-zotfile-attach-file",
      label: Zotero.locale == "zh-CN" ? "添加新文件" : "Attach New File",
      getVisibility: () =>
        ZoteroPane.getSelectedItems().some(
          (item) => item.isAttachment() || item.isRegularItem(),
        ),
      commandListener: (ev) => Zotero.ZotFile.attachFileFromSourceDirectory(),
      icon: `chrome://${config.addonRef}/content/icons/attachNewFile.png`,
    });
    // Move File
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: Zotero.locale == "zh-CN" ? "移动附件" : "Move Attachment",
      getVisibility: () =>
        ZoteroPane.getSelectedItems().some(
          (item) =>
            (item.isAttachment() || item.isRegularItem()) &&
            Zotero.Prefs.get("extensions.zotfile.show_onlymove_menu", true),
        ),
      commandListener: (ev) => Zotero.ZotFile.moveSelectedAttachments(),
      icon: `chrome://${config.addonRef}/content/icons/move.png`,
    });
    // renameAndMove.png
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: Zotero.locale == "zh-CN" ? "重命名附件并移动" : "Rename and Move",
      getVisibility: () =>
        ZoteroPane.getSelectedItems().some(
          (item) => item.isAttachment() || item.isRegularItem(),
        ),
      commandListener: (ev) => Zotero.ZotFile.renameSelectedAttachments(),
      icon: `chrome://${config.addonRef}/content/icons/renameAndMove.png`,
    });
    this.registerOpenUsing();
  }

  private async registerOpenUsing() {
    const fileHandlerArr = JSON.parse(
      (Zotero.Prefs.get(`${config.addonRef}.openUsing`) as string) || "[]",
    );
    const setPref = (fileHandlerArr: string[]) => {
      window.setTimeout(async () => {
        Zotero.Prefs.set(
          `${config.addonRef}.openUsing`,
          JSON.stringify(fileHandlerArr),
        );
        await ztoolkit.Menu.unregisterAll();
        await this.registerItemMenu();
      });
    };
    ztoolkit.Menu.register("item", {
      tag: "menu",
      label: Zotero.locale == "zh-CN" ? "打开方式" : "Open Using",
      getVisibility: () =>
        ZoteroPane.getSelectedItems().some(
          (item) =>
            item.isAttachment() ||
            (item.isRegularItem() &&
              (item.getBestAttachmentStateCached() as any).exists),
        ),
      icon: `chrome://${config.addonRef}/content/icons/openUsing.png`,
      children: [
        {
          tag: "menuitem",
          label: "Zotero",
          commandListener: async (ev) => {
            // 第二个参数应该从文件分析得出，默认pdf
            this.openSelectedItemsUsing("", "pdf");
          },
        },
        {
          tag: "menuitem",
          label: Zotero.locale == "zh-CN" ? "系统" : "System",
          commandListener: async (ev) => {
            this.openSelectedItemsUsing("system", "pdf");
          },
        },
        ...((() => {
          const children = [];
          for (const fileHandler of fileHandlerArr) {
            children.push({
              tag: "menuitem",
              // @ts-ignore
              label: window.OS.Path.basename(fileHandler),
              commandListener: async (ev: MouseEvent) => {
                if (ev.button == 2) {
                  if (window.confirm("Delete?")) {
                    const _fileHandlerArr = fileHandlerArr.filter(
                      (i: string) => i != fileHandler,
                    ) as string[];
                    setPref(_fileHandlerArr);
                  }
                } else {
                  this.openSelectedItemsUsing(fileHandler, "pdf");
                }
              },
            });
          }
          return children;
        })() as any),
        {
          tag: "menuitem",
          label: Zotero.locale == "zh-CN" ? "选择其它应用" : "Choose Other App",
          commandListener: async (ev) => {
            // #42 Multiple extensions may be included, separated by a semicolon and a space.
            const filename = await new ztoolkit.FilePicker(
              "Select Application",
              "open",
              [["Application", "*.exe; *.app"]], // support windows .exe and macOS .app both.
            ).open();
            if (filename && fileHandlerArr.indexOf(filename) == -1) {
              fileHandlerArr.push(filename);
              setPref(fileHandlerArr);
              this.openSelectedItemsUsing(filename, "pdf");
            }
          },
        },
      ],
    });
  }

  private async openSelectedItemsUsing(fileHandler: string, fileType = "pdf") {
    const _fileHandler = Zotero.Prefs.get(`fileHandler.${fileType}`) as string;
    Zotero.Prefs.set(`fileHandler.${fileType}`, fileHandler);
    const selectedItems = ZoteroPane.getSelectedItems();
    const ids: number[] = [];
    await Promise.all(
      selectedItems.map(async (item: Zotero.Item) => {
        if (item.isAttachment()) {
          ids.push(item.id);
        } else {
          ids.push((await item.getBestAttachments())[0].id);
        }
      }),
    );
    await ZoteroPane.viewAttachment(ids);
    Zotero.Prefs.set(`fileHandler.${fileType}`, _fileHandler);
  }
}
