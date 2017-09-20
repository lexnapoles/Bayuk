import { REHYDRATE } from 'redux-persist/constants';
import { combineReducers } from 'redux';
import { omit } from 'lodash/object';
import { union } from 'lodash/array';
import { getJwtPayload } from '../utils';
import { FETCH_ONE_USER, FETCH_USERS, REGISTER_USER, LOGIN_USER } from '../constants/actionTypes';
import user from './user';

const currentUserExists = (action) => {
  const { currentUser } = action.payload;

  return currentUser && currentUser.token;
};

const byId = (state = {}, action) => {
  switch (action.type) {
    case REHYDRATE: {
      if (currentUserExists(action)) {
        const { token } = action.payload.currentUser;
        const userFromToken = omit(getJwtPayload(token), ['exp', 'iat']);

        return {
          ...state,
          [userFromToken.id]: userFromToken,
        };
      }

      return state;
    }

    case FETCH_ONE_USER.success:
      return {
        ...state,
        [action.payload.id]: user(undefined, action),
      };

    case FETCH_USERS.success:
      return {
        ...state,
        ...action.payload.entities.users,
      };

    case REGISTER_USER.success:
    case LOGIN_USER.success: {
      const token = action.payload;
      const userFromToken = omit(getJwtPayload(token), ['exp', 'iat']);

      return {
        ...state,
        [userFromToken.id]: userFromToken,
      };
    }

    default: {
      return state;
    }
  }
};

const allIds = (state = [], action) => {
  switch (action.type) {
    case REHYDRATE: {
      if (currentUserExists(action)) {
        const { token } = action.payload.currentUser;
        const { id } = omit(getJwtPayload(token), ['exp', 'iat']);

        return [...state, id];
      }

      return state;
    }

    case FETCH_ONE_USER.success:
      return [...state, action.payload.id];

    case FETCH_USERS.success:
      return union(state, action.payload.result);

    case REGISTER_USER.success:
    case LOGIN_USER.success: {
      const token = action.payload;
      const { id } = getJwtPayload(token);

      return [...state, id];
    }

    default:
      return state;
  }
};

export default combineReducers({
  byId,
  allIds,
});
