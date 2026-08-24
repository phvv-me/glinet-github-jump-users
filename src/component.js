({
  name: "github-jump-users",

  data() {
    return {
      loading: true,
      working: false,
      error: "",
      notice: "",
      selectedConfig: "",
      selectedConfigTitle: "",
      status: { accounts: [], protections: [] },
      settings: { endpoint: "", ssh_port: 22 },
      accountForm: { username: "", label: "" },
      memberForm: {
        account: "jump",
        github: "",
        target_user: "",
        identity_file: "~/.ssh/id_ed25519",
      },
    };
  },

  beforeCreate() {
    if (document.getElementById("github-jump-users-style")) return;
    const style = document.createElement("link");
    style.id = "github-jump-users-style";
    style.rel = "stylesheet";
    style.href = "/theme/github-jump-users.css?v=0.0.1";
    document.head.appendChild(style);
  },

  created() {
    this.loadStatus();
  },

  methods: {
    rpc(method, params = {}) {
      return window.$rpcRequest("call", [
        "sid",
        "github-jump-users",
        method,
        params,
      ]);
    },

    applyStatus(status) {
      this.status = status;
      this.settings = {
        endpoint: status.endpoint,
        ssh_port: status.ssh_port,
      };
      if (!status.accounts.some(({ username }) => username === this.memberForm.account))
        this.memberForm.account = status.accounts[0]?.username || "";
    },

    async perform(operation, successMessage) {
      this.working = true;
      this.error = "";
      this.notice = "";
      try {
        const status = await operation;
        if (!status.success) throw new Error(status.error || "The request failed");
        this.applyStatus(status);
        this.notice = successMessage;
        return true;
      } catch (error) {
        this.error = error?.message || "The request failed";
        return false;
      } finally {
        this.working = false;
      }
    },

    async loadStatus() {
      this.loading = true;
      this.error = "";
      this.notice = "";
      try {
        this.applyStatus(await this.rpc("get_status"));
      } catch {
        this.error = "Could not load the router account registry";
      } finally {
        this.loading = false;
      }
    },

    syncUsers() {
      return this.perform(
        this.rpc("sync_users"),
        "All configured GitHub keys are current",
      );
    },

    saveSettings() {
      return this.perform(
        this.rpc("save_settings", this.settings),
        "Connection settings were saved",
      );
    },

    async createAccount() {
      const created = await this.perform(
        this.rpc("create_account", this.accountForm),
        "The restricted router account was created",
      );
      if (!created) return;
      this.memberForm.account = this.accountForm.username;
      this.accountForm = { username: "", label: "" };
    },

    removeAccount(account) {
      if (!window.confirm(`Remove the router account ${account.username} and revoke its jump access?`)) return;
      return this.perform(
        this.rpc("remove_account", { username: account.username }),
        "The router account was removed",
      );
    },

    async addMember() {
      const params = {
        ...this.memberForm,
        confirm_root: false,
      };
      if (params.account === "root") {
        params.confirm_root = window.confirm(
          `This grants ${params.github} full router administration as root. Continue?`,
        );
        if (!params.confirm_root) return;
      }
      const added = await this.perform(
        this.rpc("add_member", params),
        "The GitHub user was assigned and their keys were activated",
      );
      if (!added) return;
      this.memberForm.github = "";
      this.memberForm.target_user = "";
    },

    removeMember(account, member) {
      if (!window.confirm(`Remove ${member.github} from ${account.username}?`)) return;
      return this.perform(
        this.rpc("remove_member", {
          account: account.username,
          github: member.github,
        }),
        "The GitHub user was removed and their managed keys were revoked",
      );
    },

    connectionConfig(account, member) {
      const slug = `${account.username}-${member.github}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
      const alias = `flint-${slug}`;
      const lines = [
        `Host ${alias}`,
        `  HostName ${this.status.endpoint}`,
        `  Port ${this.status.ssh_port}`,
        `  User ${account.username}`,
        `  IdentityFile ${member.identity_file}`,
        "  IdentitiesOnly yes",
        "  RequestTTY no",
      ];

      if (account.mode === "jump") {
        lines.push(
          "",
          `Host lab-target-${member.github.toLowerCase()}`,
          "  HostName TARGET_HOST_OR_IP",
          "  Port 22",
          `  User ${member.target_user}`,
          `  IdentityFile ${member.identity_file}`,
          "  IdentitiesOnly yes",
          `  ProxyCommand ssh ${alias} connect %h %p`,
        );
      }
      return lines.join("\n");
    },

    showConfig(account, member) {
      this.selectedConfigTitle = `${account.username} for ${member.github}`;
      this.selectedConfig = this.connectionConfig(account, member);
    },

    async copyConfig() {
      try {
        await navigator.clipboard.writeText(this.selectedConfig);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = this.selectedConfig;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      this.notice = "SSH configuration copied";
    },

    formatTime(timestamp) {
      return timestamp
        ? new Date(timestamp * 1000).toLocaleString()
        : "Not synchronized yet";
    },
  },
})
