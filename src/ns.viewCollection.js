ns.ViewItem = function() {};

no.inherit(ns.ViewItem, ns.View);

ns.ViewItem.prototype._addDescendantViewTree = function(tree) {
    return tree;
};

ns.ViewItem.define = function(id, info) {
    return ns.View.define(id, info, this);
};



ns.ViewCollection = function() {};

no.inherit(ns.ViewCollection, ns.View);

ns.ViewCollection.define = function(id, info) {
	return ns.View.define(id, info, this);
};

ns.ViewCollection.prototype._createModels = function() {
	var model_id = this.info.models[0];

	if (1 !== this.info.models.length || !model_id || !ns.Model.info(model_id).isCollection) {
		throw new Error("[ns.ViewCollection] '" + this.id + "' must depend only on one model collection");
	}

	this.models = {};
	this.models[model_id] = ns.Model.create(model_id, this.params);
    console.log('ns.ViewCollection.prototype._createModels', this.models);
};

ns.ViewCollection.prototype._init = function() {
	ns.View.prototype._init.apply(this, arguments);

	if (!this.info.split || !this.info.split.view_id) {
		throw new Error("[ns.ViewCollection] '" + this.id + "' must have item view id defined");
	}
};

// ns.ViewCollection.prototype._apply = function() {};

ns.ViewCollection.prototype.getRequestViews = function(updated, pageLayout, params) {
	this._getRequestViews(updated, pageLayout, params);
    return updated;
};

ns.ViewCollection.prototype._addDescendantViewTree = function(tree) {
    $.each(this.models[this.info.models[0]].models, function(i, model) {
        // Для каждого элемента модели-коллекции создадим собственный view
        var view = this._addView(
            this.info.split.view_id,
            no.extend({}, this.params, model.params)
        );

        tree.views[view.key] = view;
    }.bind(this));

    return tree;
    // return ns.View.prototype._addDescendantViewTree.apply(this, arguments);
};

ns.ViewCollection.prototype._getView = function(key) {
    return this.views && this.views[key] || null;
};

ns.ViewCollection.prototype._addView = function(id, params) {
    if (!this.views) {
        this.views = {};
    }

    var key = ns.View.getKey(id, params);

    var view = this._getView(key);
    if (!view) {
        view = ns.View.create(id, params);
        this.views[view.key] = view;
    }

    console.log('ns.ViewCollection.prototype._addView', view, this.views);

    return view;
};

// ns.ViewCollection.prototype._updateHTML = function(node, layout, params, options, events) {
	
// };