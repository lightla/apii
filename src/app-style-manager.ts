// style-manager.ts
class AppStyleManager {
    private loadedApps = new Set<string>();

    loadStyles(appId: string) {
        if (this.loadedApps.has(appId)) return;

        const styles = this.generateStyles(appId);
        this.injectStyles(appId, styles);
        this.loadedApps.add(appId);
    }

    private generateStyles(appId: string): string {
        return `
          ${appId} {
              max-width: 100vw;
              max-height: 100vh;
              height: 100vh;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background-color: var(--app-bg-color);
          }
        `;
    }

    private injectStyles(appId: string, css: string) {
        const style = document.createElement('style');
        style.textContent = css;
        style.setAttribute('data-app', appId.replace('#', ''));
        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.documentElement.appendChild(style);
        }
    }
}

export const appStyleManager = new AppStyleManager();