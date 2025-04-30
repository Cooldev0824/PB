import { createStore } from 'vuex';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const store = createStore({
  state: {
    proposals: [], // List of proposals
    currentProposal: null, // Currently selected or edited proposal
  },
  mutations: {
    setProposals(state, proposals) {
      state.proposals = proposals;
    },
    addProposalID(state, proposal) {
      state.proposals.push(proposal);
    },
    updateProposal(state, updatedProposal) {
      const index = state.proposals.findIndex(p => p.id === updatedProposal.id);
      if (index !== -1) {
        state.proposals[index] = updatedProposal;
      }
    },
    deleteProposal(state, proposalId) {
      state.proposals = state.proposals.filter(p => p.id !== proposalId);
    },
    setCurrentProposal(state, proposal) {
      state.currentProposal = proposal;
    },
  },
  actions: {
    async fetchProposals({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/proposals`);
        commit('setProposals', response.data);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      }
    },
    async createProposalID({ commit }, proposal) {
      try {
        const response = await axios.post(`${API_URL}/proposalID`, proposal);
        commit('addProposalID', response.data);
        return response.data; // Return the created proposal
      } catch (error) {
        console.error('Error creating proposalID:', error);
        throw error; // Re-throw the error to handle it in the component
      }
    },
    async updateProposal({ commit }, { id, content, background, pageSize }) {
      try {
        const response = await fetch(`${API_URL}/proposals/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, content, background, pageSize }),
        });

        if (!response.ok) {
          throw new Error('Failed to update proposal');
        }

        console.log(response.body);
        const updatedProposal = await response.json();
        return updatedProposal;
      } catch (error) {
        console.error('Error updating proposal:', error);
        throw error;
      }
    },
    async deleteProposal({ commit }, id) {
      try {
        await axios.delete(`${API_URL}/proposals/${id}`);
        commit('deleteProposal', id);
      } catch (error) {
        console.error('Error deleting proposal:', error);
      }
    },
    async getProposal({ commit }, id) {
      try {
        const response = await axios.get(`${API_URL}/proposals/${id}`);
        commit('setCurrentProposal', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching proposal:', error);
        throw error;
      }
    }
  },
  getters: {
    allProposals: state => state.proposals,
    currentProposal: state => state.currentProposal,
  },
});

export default store;
