const { result } = require("lodash");
const { newCloudinary, getResourceOptions } = require("./utils");
const type = `CloudinaryMedia`;

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

const createCloudinaryNodes = async (
  gatsby,
  cloudinary,
  options,
  { limit }
) => {
  const { reporter } = gatsby;
  let nextCursor = null;

  do {
    const result = await cloudinary.api.resources({
      resource_type: "image",
      max_results: limit < 10 ? limit : 10,
      next_cursor: nextCursor,
    });
    reporter.info(
      `fetched 🌩️ Assets >>> ${result.resources.length} from ${nextCursor}`
    );

    result.resources.forEach((resource) => {
      const transformations = "q_auto,f_auto"; // Default CL transformations, todo: fetch base transformations from config maybe.

      resource.url = addTransformations(resource, transformations);
      resource.secure_url = addTransformations(resource, transformations, true);

      const nodeData = getNodeData(gatsby, resource);
      gatsby.actions.createNode(nodeData);
    });

    nextCursor = result.next_cursor;
    limit = limit - 10;
  } while (nextCursor && limit > 0);
};

exports.sourceNodes = (gatsby, options) => {
  const cloudinary = newCloudinary(options);
  const resourceOptions = getResourceOptions(options);

  return createCloudinaryNodes(gatsby, cloudinary, resourceOptions, {
    limit: 27,
  });
};
