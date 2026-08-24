({
  name: "github-jump-users",

  data() {
    return {
      loading: true,
      working: false,
      error: "",
      selectedConfig: "",
      selectedConfigTitle: "",
      activeAccount: "root",
      showAddUser: false,
      status: { accounts: [] },
      memberForm: {
        github: "",
      },
    };
  },

  created() {
    this.loadStatus();
  },

  computed: {
    githubRules() {
      return [
        { required: true, message: "Enter a GitHub username", trigger: "blur" },
        {
          pattern: /^(?!-)(?!.*--)[A-Za-z0-9-]{0,38}[A-Za-z0-9]$/,
          message: "Enter a valid GitHub username",
          trigger: "blur",
        },
      ];
    },
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
      if (!status.accounts.some(({ username }) => username === this.activeAccount))
        this.activeAccount = status.accounts[0]?.username || "root";
    },

    async perform(operation, successMessage) {
      this.working = true;
      this.error = "";
      try {
        const status = await operation;
        if (!status.success) throw new Error(status.error || "The request failed");
        this.applyStatus(status);
        this.$message.closeAll();
        this.$message.success(successMessage);
        return true;
      } catch (error) {
        this.error = error?.message || "The request failed";
        return false;
      } finally {
        this.working = false;
      }
    },

    async loadStatus() {
      try {
        this.applyStatus(await this.rpc("get_status"));
      } catch (error) {
        this.error = error?.message || "Could not load access";
      } finally {
        this.loading = false;
      }
    },

    syncUsers() {
      return this.perform(
        this.rpc("sync_users"),
        "GitHub keys synchronized",
      );
    },

    showAddDialog(account) {
      this.activeAccount = account;
      this.memberForm.github = "";
      this.showAddUser = true;
      this.$nextTick(() => this.$refs.memberForm.clearValidate());
    },

    async addMember() {
      if (!await this.$refs.memberForm.validate()) return;
      const params = {
        account: this.activeAccount,
        github: this.memberForm.github,
        confirm_root: false,
      };
      const assign = async () => {
        if (!await this.perform(this.rpc("add_member", params), "User assigned")) return;
        this.memberForm.github = "";
        this.showAddUser = false;
      };
      if (params.account === "root") {
        return this.$alert(
          `Grant ${params.github} full router administration?`,
          {
            confirmText: "Grant root access",
            confirmBtnType: "error",
            confirmAutoClose: false,
            onConfirm: async ({ close }) => {
              params.confirm_root = true;
              await assign();
              if (!this.error) close();
            },
          },
        );
      }
      return assign();
    },

    removeMember(account, member) {
      return this.$alert(
        `Remove ${member.github} from ${account.username}?`,
        {
          confirmText: "Remove",
          confirmBtnType: "error",
          confirmAutoClose: false,
          onConfirm: async ({ close }) => {
            await this.perform(
              this.rpc("remove_member", {
                account: account.username,
                github: member.github,
              }),
              "User removed",
            );
            if (!this.error) close();
          },
        },
      );
    },

    connectionConfig(account) {
      const lines = [
        "Host cvlab",
        `  HostName ${this.status.endpoint}`,
        `  Port ${this.status.ssh_port}`,
        `  User ${account.username}`,
        "  RequestTTY no",
      ];

      if (account.mode === "jump") {
        lines.push(
          "",
          "Host {target}",
          "  HostName {target}",
          "  Port 22",
          "  ProxyCommand ssh cvlab connect %h %p",
        );
      }
      return lines.join("\n");
    },

    showConfig(account, member) {
      this.selectedConfigTitle = `${account.username} for ${member.github}`;
      this.selectedConfig = this.connectionConfig(account);
    },

    closeConfig() {
      this.selectedConfig = "";
      this.selectedConfigTitle = "";
    },

    copyConfig() {
      return this.$copyText(this.selectedConfig)
        .then(() => {
          this.$message.closeAll();
          this.$message.success("SSH configuration copied");
        })
        .catch((error) => {
          this.error = error?.message || "Could not copy SSH configuration";
        });
    },

  },
})
