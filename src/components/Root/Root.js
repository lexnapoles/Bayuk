/* eslint-disable react/forbid-prop-types */

import PropTypes from "prop-types";
import React from "react";
import { Provider } from "react-redux";
import routes from "../../routes/routes";

const Root = ({ store }) => <Provider store={store}>{routes}</Provider>;

Root.propTypes = {
  store: PropTypes.object.isRequired
};

export default Root;
