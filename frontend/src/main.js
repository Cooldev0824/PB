import { createRouter, createWebHistory } from 'vue-router';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from './App.vue';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import store from './store'; // Import the Vuex store

// Import your views
import Dashboard from './views/Dashboard.vue';
import Editor from './views/Editor.vue';
import CreateProposal from './views/CreateProposal.vue';
import ExportProposal from './views/ExportProposal.vue';
import ProposalEditor from './views/ProposalEditor.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Dashboard,
    },
    {
      path: '/proposal/create/:id',
      component: CreateProposal,
    },
    {
      path: '/proposal/edit/:id',
      component: Editor,
    },
    {
      path: '/proposal/new-editor/:id',
      component: ProposalEditor,
    },
    {
      path: '/export/:id',
      component: ExportProposal,
    },
  ],
});

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
});

const app = createApp(App);
app.use(router);
app.use(store); // Register the Vuex store
console.log(store._actions);
app.use(vuetify);
app.mount('#app');



