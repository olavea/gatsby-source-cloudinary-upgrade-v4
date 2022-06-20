const { newCloudinary, getResourceOptions } = require("./utils");
const type = `CloudinaryMedia`;

// gatsby-node.js
// 1.1 🤯. 🔌 ☑️ 🎶  = ({ 😹 }) => {
exports.pluginOptionsSchema = ({ Joi }) => {
  // 1.2 return 😹.📖({
  return Joi.object({
    // 1.3  😹.🧶().®️().💁(`Enables`),
    cloudName: Joi.string().required().description(`Enables cloudName.`),
    apiKey: Joi.string().required().description(`Enables apiKey.`),
    apiSecret: Joi.string().required().description(`Enables apiSecret.`),
    uploadFolder: Joi.string().required().description(`Enables uploadFolder.`),
  });
};

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
