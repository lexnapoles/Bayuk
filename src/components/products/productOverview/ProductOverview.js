import React, {Component} from "react";
import {product} from "./productOverview.css";
import {getImagePath} from "../../../../utils/utils";

class ProductOverview extends Component {
	render() {
		const {images, name, price} = this.props.product;

		return (
			<div className={product} onClick={this.props.onClick}>
				<img src={getImagePath("product", images[0])}/>
				<h2>{parseInt(price)}</h2>
				<h3>{name}</h3>
			</div>
		);
	}
}

ProductOverview.propTypes = {
	product: React.PropTypes.object.isRequired,
	onClick: React.PropTypes.func
};

export default ProductOverview;