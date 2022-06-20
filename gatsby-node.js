const { newCloudinary, getResourceOptions } = require("./utils");
const type = `CloudinaryMedia`;

// 3.0. npm i gatsby-plugin-utils

// 3.1. 💩🐸On🔌👸 is undefined;
let coreSupportsOnPluginInit = undefined;

// 3.2. try {} catch
try {
  // 3.3. is💜NodeLife🚴‍♀️🐸 from npm i gatsby-plugin-utils
  const { isGatsbyNodeLifecycleSupported } = require(`gatsby-plugin-utils`);

  // 3.4. if 💩🐸On🔌👸 === "🏴‍☠️" or === "un🏴‍☠️"
  if (isGatsbyNodeLifecycleSupported(`onPluginInit`)) {
    coreSupportsOnPluginInit = "stable";
  } else if (isGatsbyNodeLifecycleSupported(`unstable_onPluginInit`)) {
    coreSupportsOnPluginInit = "unstable";
  }
} catch (error) {
  console.error(`Could not check if Gatsby supports onPluginInit lifecycle 🚴‍♀️`);
}
// 3.5. const global🔌Options
const globalPluginOptions = {};

// 3.6.  👸🌐🌀
const initializaGlobalState = ({ newCloudinary, getResourceOptions }) => {
  // I a not sure if I am guessing right on how I am using newCloudinary && getResourceOptions
  // and how do I test if this works?
  globalPluginOptions = newCloudinary && getResourceOptions;
};

// 3.7 if (💩🐸On🔌👸 === 'stable') {} else if (💩🐸On🔌👸 === 'unstable') {} else {}

if (coreSupportsOnPluginInit === "stable") {
  exports.onPluginInit = initializaGlobalState;
} else if (coreSupportsOnPluginInit === "unstable") {
  exports.unstable_onPluginInit = initializaGlobalState;
} else {
  exports.onPreBootstrap = initializaGlobalState;
}

const getNodeData = (gatsby, media) => {
  return {
    ...media,
    id: gatsby.createNodeId(`cloudinary-media-${media.public_id}`),
    parent: null,
    internal: {
      type,
      content: JSON.stringify(media),
      contentDigest: gatsby.createContentDigest(media),
    },
  };
};

const addTransformations = (resource, transformation, secure) => {
  const splitURL = secure
    ? resource.secure_url.split("/")
    : resource.url.split("/");
  splitURL.splice(6, 0, transformation);

  const transformedURL = splitURL.join("/");
  return transformedURL;
};

const createCloudinaryNodes = (gatsby, cloudinary, options) => {
  return cloudinary.api.resources(options, (error, result) => {
    const hasResources = result && result.resources && result.resources.length;

    if (error) {
      console.error(error);
      return;
    }

    if (!hasResources) {
      console.warn(
        "\n ~Yikes! No nodes created because no Cloudinary resources found. Try a different query?"
      );
      return;
    }

    result.resources.forEach((resource) => {
      const transformations = "q_auto,f_auto"; // Default CL transformations, todo: fetch base transformations from config maybe.

      resource.url = addTransformations(resource, transformations);
      resource.secure_url = addTransformations(resource, transformations, true);

      const nodeData = getNodeData(gatsby, resource);
      gatsby.actions.createNode(nodeData);
    });

    console.info(
      `Added ${hasResources} CloudinaryMedia ${
        hasResources > 1 ? "nodes" : "node"
      }`
    );
  });
};

exports.sourceNodes = (gatsby, options) => {
  const cloudinary = newCloudinary(options);
  const resourceOptions = getResourceOptions(options);

  return createCloudinaryNodes(gatsby, cloudinary, resourceOptions);
};
