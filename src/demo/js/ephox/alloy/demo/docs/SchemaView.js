define(
  'ephox.alloy.demo.docs.SchemaView',

  [
    'ephox.alloy.api.component.GuiFactory',
    'ephox.alloy.api.ui.Container',
    'ephox.alloy.demo.docs.Documentation',
    'ephox.boulder.api.DslType',
    'ephox.boulder.api.Objects',
    'ephox.boulder.api.ValueSchema',
    'ephox.katamari.api.Type',
    'ephox.katamari.api.Arr',
    'ephox.katamari.api.Obj',
    'ephox.sand.api.JSON',
    'ephox.katamari.api.Fun'
  ],

  function (
    GuiFactory, Container, Documentation, DslType, Objects, ValueSchema, Type, Arr, Obj,
    Json, Fun
  ) {
    var getDescription = function (key) {
      if (Objects.hasKey(Documentation, key)) return Documentation[key].desc;
      else return '<span style="outline: 1px solid red;">' + key + '</span>';
    };

    var buildSet = function (path, _sValidator, sType) {
      return Container.sketch({
        dom: {
          tag: 'div',
          classes: [ 'docs-set' ]
        },
        components: [
          build(path, sType.toDsl())
        ]
      });
    };

    var buildArray = function (path, aType) {
      return Container.sketch({
        dom: {
          tag: 'div',
          classes: [ 'docs-array' ]
        },
        components: [
          build(path, aType.toDsl())
        ]
      });
    };

    var buildField = function (path, key, presence, type) {
      var fieldComp = build(path.concat(key), type.toDsl());

      var extraDom = presence.fold(
        function () {
          return {
            wrapper: {
              classes: [ 'strict' ]
            },
            span: { }
          };
        },
        function (fallbackThunk) {
          var fallback = fallbackThunk();
          var value = (function () {
            if (Type.isFunction(fallback) && fallback === Fun.noop) return 'noOp';
            else if (fallback === Fun.identity) return 'identity';
            else if (Type.isFunction(fallback)) return 'function';
            else return Json.stringify(fallback, null, 2);
          })();

          return {
            wrapper: {
              classes: [ 'defaulted' ]
            },
            span: {
              attributes: {
                'title': '(' + value + ') '
              }
            }
          };
        },
        function () {
          return {
            wrapper: { classes: [ 'optional' ] },
            span: { }
          }
        },

        function () {
          return {
            wrapper: { },
            span: { }
          };
        },

        function () {
          return {
            wrapper: { },
            span: { }
          };
        }
      );

      return Container.sketch({
        dom: {
          tag: 'div',
          classes: [ 'docs-field' ]
        },
        domModification: extraDom.wrapper,
        components: [
          Container.sketch({
            dom: {
              tag: 'span',
              classes: [ 'docs-field-name' ]
            },
            components: [
              GuiFactory.text(key + ': ')
            ],
            domModification: extraDom.span
          }),
          fieldComp
        ]
      });
   
    };

    var buildObject = function (path, oFields) {
      var subs = Arr.bind(oFields, function (f) {
        return DslType.foldField(f, 
          function (key, presence, type) {
            return [ buildField(path, key, presence, type) ];
          }, function (_) {
            return [ ];
          }
        );
      });

      return Container.sketch({
        dom: {
          tag: 'div',
          classes: [ 'docs-obj' ]
        },
        components: subs
      });
    };


    var build = function (path, dsl) {
      return DslType.foldType(
        dsl,
        function (_sValidator, sType) {
          return buildSet(path, _sValidator, sType);
        },
        function (aType) {
          return buildArray(path, aType);
        },
        function (oFields) {
          return buildObject(path, oFields);
        },
        function (oValue) {
          return Container.sketch({
            dom: {
              tag: 'span',
              classes: [ 'docs-item' ],
              innerHtml: getDescription(path.join(' > '))
            }
          });
        },

        function (cKey, cBranches) {
          var branches = Obj.keys(cBranches);

          var cs = Arr.map(branches, function (b) {
            return Container.sketch({
              dom: {
                tag: 'div',
                classes: [ 'docs-branch-mode' ]
              },
              components: [
                Container.sketch({
                  dom: {
                    tag: 'span',
                    classes: [ 'docs-branch-mode-identifier' ],
                    innerHtml: cKey + ' == ' + b + ': '
                  }
                }),
                build(path.concat([ '::' + b + '::' ]), ValueSchema.objOf(cBranches[b]).toDsl())
              ]
            });
          });

          return Container.sketch({
            dom: {
              tag: 'span',
              classes: [ 'docs-mode' ]
            },
            components: [
              GuiFactory.text('branch on ' + cKey)
            ].concat(cs)
          });
        }
      );
    };

    return {
      getDescription: getDescription,
      build: build
    };
 
  }
);