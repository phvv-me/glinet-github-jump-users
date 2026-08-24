(() => {
  const component = ({
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
});
  component.render = function () { with(this){return _c('div',{staticClass:"gjju gj:flex gj:flex-col gj:gap-4",attrs:{"data-theme":"glinet"}},[_c('gl-title',{attrs:{"title":"GitHub Jump Users"}}),_c('p',{staticClass:"gj:text-sm gj:opacity-70"},[_v(" See exactly which GitHub identities can use each router account ")]),(error)?_c('div',{staticClass:"gj-alert gj-alert-error",attrs:{"role":"alert"}},[_c('span',[_v(_s(error))])]):_e(),(notice)?_c('div',{staticClass:"gj-alert gj-alert-success",attrs:{"role":"status"}},[_c('span',[_v(_s(notice))])]):_e(),(loading)?_c('div',{staticClass:"gj-card gj:bg-base-100 gj:p-6"},[_c('span',{staticClass:"gj-loading gj-loading-spinner gj-loading-sm"}),_v(" Loading router accounts ")]):[_c('div',{staticClass:"gj-stats gj-stats-vertical gj:bg-base-100 gj:shadow-sm gj:md:grid-flow-col"},[_c('div',{staticClass:"gj-stat"},[_c('div',{staticClass:"gj-stat-title"},[_v("Router accounts")]),_c('div',{staticClass:"gj-stat-value"},[_v(_s(status.account_count))])]),_c('div',{staticClass:"gj-stat"},[_c('div',{staticClass:"gj-stat-title"},[_v("GitHub assignments")]),_c('div',{staticClass:"gj-stat-value"},[_v(_s(status.member_count))])]),_c('div',{staticClass:"gj-stat"},[_c('div',{staticClass:"gj-stat-title"},[_v("Managed keys")]),_c('div',{staticClass:"gj-stat-value"},[_v(_s(status.key_count))])])]),_m(0),_c('section',{staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('h2',{staticClass:"gj:mb-4 gj:text-lg gj:font-semibold"},[_v("Connection settings")]),_c('div',{staticClass:"gj:grid gj:gap-3 gj:md:grid-cols-2"},[_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Public hostname")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(settings.endpoint),expression:"settings.endpoint",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",attrs:{"type":"text"},domProps:{"value":(settings.endpoint)},on:{"input":function($event){if($event.target.composing)return;$set(settings, "endpoint", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})]),_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("SSH port")]),_c('input',{directives:[{name:"model",rawName:"v-model.number",value:(settings.ssh_port),expression:"settings.ssh_port",modifiers:{"number":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",attrs:{"min":"1","max":"65535","type":"number"},domProps:{"value":(settings.ssh_port)},on:{"input":function($event){if($event.target.composing)return;$set(settings, "ssh_port", _n($event.target.value))},"blur":function($event){return $forceUpdate()}}})])]),_c('button',{staticClass:"gj-btn gj-btn-primary gj:mt-4",attrs:{"disabled":working},on:{"click":saveSettings}},[_v(" Save settings ")])]),_c('div',{staticClass:"gj:grid gj:gap-4 gj:lg:grid-cols-2"},[_c('section',{staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('h2',{staticClass:"gj:text-lg gj:font-semibold"},[_v("Create a restricted router account")]),_c('p',{staticClass:"gj:my-2 gj:text-sm gj:opacity-70"},[_v(" The account is locked and every managed key is limited to the forced jump command ")]),_c('div',{staticClass:"gj:grid gj:gap-3 gj:md:grid-cols-2"},[_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Router username")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(accountForm.username),expression:"accountForm.username",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",domProps:{"value":(accountForm.username)},on:{"input":function($event){if($event.target.composing)return;$set(accountForm, "username", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})]),_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Display label")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(accountForm.label),expression:"accountForm.label",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",domProps:{"value":(accountForm.label)},on:{"input":function($event){if($event.target.composing)return;$set(accountForm, "label", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})])]),_c('button',{staticClass:"gj-btn gj-btn-primary gj:mt-4",attrs:{"disabled":working},on:{"click":createAccount}},[_v(" Create account ")])]),_c('section',{staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('h2',{staticClass:"gj:mb-3 gj:text-lg gj:font-semibold"},[_v("Assign a GitHub user")]),_c('div',{staticClass:"gj:grid gj:gap-3 gj:md:grid-cols-2"},[_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Router account")]),_c('select',{directives:[{name:"model",rawName:"v-model",value:(memberForm.account),expression:"memberForm.account"}],staticClass:"gj-select gj-select-bordered gj:w-full",on:{"change":function($event){var $$selectedVal = Array.prototype.filter.call($event.target.options,function(o){return o.selected}).map(function(o){var val = "_value" in o ? o._value : o.value;return val}); $set(memberForm, "account", $event.target.multiple ? $$selectedVal : $$selectedVal[0])}}},_l((status.accounts),function(account){return _c('option',{key:account.username,domProps:{"value":account.username}},[_v(" "+_s(account.label)+" "+_s(account.username)+" ")])}),0)]),_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("GitHub username")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(memberForm.github),expression:"memberForm.github",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",domProps:{"value":(memberForm.github)},on:{"input":function($event){if($event.target.composing)return;$set(memberForm, "github", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})]),_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Target SSH username")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(memberForm.target_user),expression:"memberForm.target_user",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",domProps:{"value":(memberForm.target_user)},on:{"input":function($event){if($event.target.composing)return;$set(memberForm, "target_user", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})]),_c('label',[_c('span',{staticClass:"gj:mb-1 gj:text-xs gj:opacity-70"},[_v("Private key path on their computer")]),_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(memberForm.identity_file),expression:"memberForm.identity_file",modifiers:{"trim":true}}],staticClass:"gj-input gj-input-bordered gj:w-full",domProps:{"value":(memberForm.identity_file)},on:{"input":function($event){if($event.target.composing)return;$set(memberForm, "identity_file", $event.target.value.trim())},"blur":function($event){return $forceUpdate()}}})])]),_c('button',{staticClass:"gj-btn gj-btn-primary gj:mt-4",attrs:{"disabled":working},on:{"click":addMember}},[_v(" Assign and activate ")])])]),_c('header',{staticClass:"gj:flex gj:flex-wrap gj:items-end gj:justify-between gj:gap-3"},[_c('div',[_c('h2',{staticClass:"gj:text-xl gj:font-semibold"},[_v("Router accounts and access")]),_c('p',{staticClass:"gj:text-sm gj:opacity-70"},[_v("Last key update "+_s(formatTime(status.updated_at)))])]),_c('div',{staticClass:"gj:flex gj:gap-2"},[_c('button',{staticClass:"gj-btn gj-btn-outline",attrs:{"disabled":working},on:{"click":loadStatus}},[_v("Refresh state")]),_c('button',{staticClass:"gj-btn gj-btn-primary",attrs:{"disabled":working},on:{"click":syncUsers}},[(working)?_c('span',{staticClass:"gj-loading gj-loading-spinner gj-loading-xs"}):_e(),_v(" "+_s(working ? "Working" : "Sync keys from GitHub")+" ")])])]),_c('p',{staticClass:"gj:text-sm gj:opacity-70"},[_v(" Refresh state only rereads this router. Sync keys downloads every assigned GitHub user's current public keys and updates access. ")]),_l((status.accounts),function(account){return _c('section',{key:account.username,staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('header',{staticClass:"gj:flex gj:flex-wrap gj:items-center gj:justify-between gj:gap-3"},[_c('div',[_c('h3',{staticClass:"gj:text-lg gj:font-semibold"},[_v(_s(account.label))]),_c('p',{staticClass:"gj:text-sm gj:opacity-70"},[_v(" "+_s(account.username)+" on port "+_s(status.ssh_port)+" ")])]),_c('div',{staticClass:"gj:flex gj:items-center gj:gap-2"},[_c('span',{staticClass:"gj-badge",class:account.mode === 'admin' ? 'gj-badge-error' : 'gj-badge-success'},[_v(" "+_s(account.mode === "admin" ? "Full router administrator" : "Restricted jump only")+" ")]),(account.removable)?_c('button',{staticClass:"gj-btn gj-btn-error gj-btn-outline gj-btn-sm",on:{"click":function($event){return removeAccount(account)}}},[_v(" Remove account ")]):_e()])]),(account.unmanaged_key_count)?_c('p',{staticClass:"gj:mt-3 gj:text-sm gj:opacity-70"},[_v(" "+_s(account.unmanaged_key_count)+" key entries are managed outside this plugin and are preserved during sync ")]):_e(),_c('div',{staticClass:"gj:mt-4 gj:overflow-x-auto"},[_c('table',{staticClass:"gj-table"},[_m(1,true),_c('tbody',[(!account.members.length)?_c('tr',[_c('td',{staticClass:"gj:opacity-70",attrs:{"colspan":"4"}},[_v("No GitHub users are assigned")])]):_e(),_l((account.members),function(member){return _c('tr',{key:member.github},[_c('td',[_c('a',{staticClass:"gj:font-semibold gj:text-primary",attrs:{"href":`https://github.com/${member.github}`,"target":"_blank","rel":"noopener noreferrer"}},[_v(" "+_s(member.github)+" ")])]),_c('td',[_v(_s(member.target_user))]),_c('td',[_v(_s(member.key_count)+" "+_s(member.key_types.join(", ") || "keys pending"))]),_c('td',[_c('div',{staticClass:"gj:flex gj:gap-2"},[_c('button',{staticClass:"gj-btn gj-btn-outline gj-btn-sm",on:{"click":function($event){return showConfig(account, member)}}},[_v("SSH config")]),_c('button',{staticClass:"gj-btn gj-btn-error gj-btn-outline gj-btn-sm",on:{"click":function($event){return removeMember(account, member)}}},[_v("Remove")])])])])})],2)])])])}),(selectedConfig)?_c('section',{staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('header',{staticClass:"gj:flex gj:items-center gj:justify-between gj:gap-3"},[_c('div',[_c('h3',{staticClass:"gj:text-lg gj:font-semibold"},[_v("SSH configuration")]),_c('p',{staticClass:"gj:text-sm gj:opacity-70"},[_v(_s(selectedConfigTitle))])]),_c('button',{staticClass:"gj-btn gj-btn-primary",on:{"click":copyConfig}},[_v("Copy configuration")])]),_c('p',{staticClass:"gj:my-3 gj:text-sm gj:opacity-70"},[_v(" Paste this into ~/.ssh/config. Replace TARGET_HOST_OR_IP in restricted jump templates. ")]),_c('div',{staticClass:"gj-mockup-code"},[_c('pre',{attrs:{"data-prefix":""}},[_c('code',[_v(_s(selectedConfig))])])])]):_e(),_c('section',{staticClass:"gj-card gj:bg-base-100 gj:p-5 gj:shadow-sm"},[_c('h3',{staticClass:"gj:mb-3 gj:text-lg gj:font-semibold"},[_v("Restricted account protections")]),_c('ul',{staticClass:"gj:list-disc gj:space-y-1 gj:pl-5"},_l((status.protections),function(item){return _c('li',{key:item},[_v(_s(item))])}),0)])]],2)} };
  component.staticRenderFns = [function () { with(this){return _c('div',{staticClass:"gj-alert gj-alert-warning",attrs:{"role":"alert"}},[_c('div',[_c('strong',[_v("Any target is enabled")]),_c('p',{staticClass:"gj:mt-1 gj:text-sm"},[_v(" Restricted jump users can open TCP connections to every destination reachable from this router, including router-local network services. They still cannot open a router shell. ")])])])} },
function () { with(this){return _c('thead',[_c('tr',[_c('th',[_v("GitHub user")]),_c('th',[_v("Target SSH user")]),_c('th',[_v("Active keys")]),_c('th',[_v("Actions")])])])} }];
  return component;
})()
