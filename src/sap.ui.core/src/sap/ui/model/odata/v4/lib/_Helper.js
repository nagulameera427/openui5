/*!
 * ${copyright}
 */

//Provides class sap.ui.model.odata.v4.lib.Requestor
sap.ui.define(["jquery.sap.global"], function (jQuery) {
	"use strict";

	var rAmpersand = /&/g,
		rEquals = /\=/g,
		rHash = /#/g,
		rPlus = /\+/g,
		rQuote = /\"/g,
		rSemicolon = /;/g,
		Helper;

	Helper = {
		/**
		 * Builds a query string from the given parameter map. Takes care of encoding, but ensures
		 * that the characters "$", "(", ")" and "=" are not encoded, so that OData queries remain
		 * readable.
		 *
		 * @param {object} [mParameters]
		 *   a map of key-value pairs representing the query string, the value in this pair has to
		 *   be a string or an array of strings; if it is an array, the resulting query string
		 *   repeats the key for each array value.
		 *   Examples:
		 *   buildQuery({foo: "bar", "bar": "baz"}) results in the query string "?foo=bar&bar=baz"
		 *   buildQuery({foo: ["bar", "baz"]}) results in the query string "?foo=bar&foo=baz"
		 * @returns {string}
		 *   the query string; it is empty if there are no parameters; it starts with "?" otherwise
		 */
		buildQuery : function (mParameters) {
			var aKeys, aQuery;

			if (!mParameters) {
				return "";
			}

			aKeys = Object.keys(mParameters);
			if (aKeys.length === 0) {
				return "";
			}

			aQuery = [];
			aKeys.forEach(function (sKey) {
				var vValue = mParameters[sKey];

				if (Array.isArray(vValue)) {
					vValue.forEach(function (sItem) {
						aQuery.push(Helper.encodePair(sKey, sItem));
					});
				} else {
					aQuery.push(Helper.encodePair(sKey, vValue));
				}
			});

			return "?" + aQuery.join("&");
		},

		/**
		 * Returns an <code>Error</code> instance from a jQuery XHR wrapper.
		 *
		 * @param {object} jqXHR
		 *   a jQuery XHR wrapper as received by a failure handler
		 * @param {function} jqXHR.getResponseHeader
		 *   used to access the HTTP response header "Content-Type"
		 * @param {string} jqXHR.responseText
		 *   HTTP response body, sometimes in JSON format ("Content-Type" : "application/json")
		 *   according to OData "19 Error Response" specification, sometimes plain text
		 *   ("Content-Type" : "text/plain"); other formats are ignored
		 * @param {number} jqXHR.status
		 *   HTTP status code
		 * @param {string} jqXHR.statusText
		 *   HTTP status text
		 * @returns {Error}
		 *   an <code>Error</code> instance with the following properties:
		 *   <ul>
		 *     <li><code>error</code>: the "error" value from the OData v4 error response JSON
		 *     object (if available);
		 *     <li><code>isConcurrentModification</code>: <code>true</code> in case of a
		 *     concurrent modification detected via ETags (i.e. HTTP status code 412);
		 *     <li><code>message</code>: error message;
		 *     <li><code>status</code>: HTTP status code;
		 *     <li><code>statusText</code>: HTTP status text.
		 *   </ul>
		 * @see <a href=
		 * "http://docs.oasis-open.org/odata/odata-json-format/v4.0/os/odata-json-format-v4.0-os.html"
		 * >"19 Error Response"</a>
		 */
		createError : function (jqXHR) {
			var sBody = jqXHR.responseText,
				sContentType = jqXHR.getResponseHeader("Content-Type").split(";")[0],
				oResult = new Error(jqXHR.status + " " + jqXHR.statusText);

			oResult.status = jqXHR.status;
			oResult.statusText = jqXHR.statusText;

			if (jqXHR.status === 412) {
				oResult.isConcurrentModification = true;
			}
			if (sContentType === "application/json") {
				try {
					// "The error response MUST be a single JSON object. This object MUST have a
					// single name/value pair named error. The value must be a JSON object."
					oResult.error = JSON.parse(sBody).error;
					oResult.message = oResult.error.message;
				} catch (e) {
					jQuery.sap.log.warning(e.toString(), sBody,
						"sap.ui.model.odata.v4.lib._Helper");
				}
			} else if (sContentType === "text/plain") {
				oResult.message = sBody;
			}

			return oResult;
		},

		/**
		 * Deserializes batch response body using batch boundary from the specified value of the
		 * 'Content-Type' header.
		 *
		 * @param {string} sContentType
		 *   value of the Content-Type header from the batch response
		 *   (e.g. "multipart/mixed; boundary=batch_123456")
		 * @param {string} sResponseBody
		 *   batch response body
		 * @returns {object[]} array containing responses from the batch response body. Each of the
		 * returned responses has the following structure:
		 *   <ul>
		 *     <li><code>status</code>: {number} HTTP status code;
		 *     <li><code>statusText</code>: {string} HTTP status text;
		 *     <li><code>headers</code>: {object} map of the response headers;
		 *     <li><code>responseText</code>: {string} response body.
		 *   </ul>
		 */
		deserializeBatchResponse : function (sContentType, sResponseBody) {
			var aBatchParts = sResponseBody.split(getBoundaryRegExp()),
				aResponses = [];

			function getBoundaryRegExp() {
				var sBatchBoundary,
					iBoundaryIndex = sContentType.indexOf("boundary=") + 9, // "boundary=".length
					iSemicolonIndex = sContentType.indexOf(";", iBoundaryIndex);

				iSemicolonIndex = iSemicolonIndex > 0 ? iSemicolonIndex : undefined;
				sBatchBoundary = sContentType.slice(iBoundaryIndex, iSemicolonIndex).trim();

				// remove possible quotes
				sBatchBoundary = sBatchBoundary.replace(rQuote, "");

				// escape RegExp-related characters
				sBatchBoundary = jQuery.sap.escapeRegExp(sBatchBoundary);
				return new RegExp('--' + sBatchBoundary + '-{0,2} *\r\n');
			}

			// skip preamble and epilogue
			aBatchParts = aBatchParts.slice(1, -1);

			aBatchParts.forEach(function (sBatchPart) {
				var i,
					iColonIndex,
					sHeader,
					aHttpHeaders,
					aHttpStatusInfos,
					oResponse = {},
					aResponseParts;

				// aResponseParts will take 3 elements:
				// 0: general batch part headers
				// 1: HTTP response headers and status line
				// 2: HTTP response body
				aResponseParts = sBatchPart.split('\r\n\r\n');
				aHttpHeaders = aResponseParts[1].split('\r\n');
				// e.g. HTTP/1.1 200 OK
				aHttpStatusInfos = aHttpHeaders[0].split(' ');

				oResponse.status = parseInt(aHttpStatusInfos[1], 10);
				oResponse.statusText = aHttpStatusInfos.slice(2).join(' ');
				oResponse.headers = {};

				// start with index 1 to skip status line
				for (i = 1; i < aHttpHeaders.length; i++) {
					// e.g. Content-Type: application/json;odata.metadata=minimal
					sHeader = aHttpHeaders[i];
					iColonIndex = sHeader.indexOf(':');
					oResponse.headers[sHeader.slice(0, iColonIndex).trim()] =
						sHeader.slice(iColonIndex + 1).trim();
				}

				oResponse.responseText = aResponseParts[2].trim();
				aResponses.push(oResponse);
			});

			return aResponses;
		},

		/**
		 * Encodes a query part, either a key or a value.
		 *
		 * @param {string} sPart
		 *   the query part
		 * @param {boolean} bEncodeEquals
		 *   if true, "=" is encoded, too
		 * @returns {string}
		 *   the encoded query part
		 */
		encode : function (sPart, bEncodeEquals) {
			var sEncoded = encodeURI(sPart)
					.replace(rAmpersand, "%26")
					.replace(rHash, "%23")
					.replace(rPlus, "%2B")
					.replace(rSemicolon, "%3B");
			if (bEncodeEquals) {
				sEncoded = sEncoded.replace(rEquals, "%3D");
			}
			return sEncoded;
		},

		/**
		 * Encodes a key-value pair.
		 *
		 * @param {string} sKey
		 *   the key
		 * @param {string} sValue
		 *   the sValue
		 * @returns {string}
		 *   the encoded key-value pair in the form "key=value"
		 */
		encodePair : function (sKey, sValue) {
			return Helper.encode(sKey, true) + "=" + Helper.encode(sValue, false);
		},

		/**
		 * Checks that the value is a safe integer.
		 *
		 * @param {number} iNumber the value
		 * @returns {boolean}
		 *   true if the value is a safe integer
		 */
		isSafeInteger : function (iNumber) {
			if (typeof iNumber !== "number" || !isFinite(iNumber)) {
				return false;
			}
			iNumber = Math.abs(iNumber);
			// The safe integers consist of all integers from -(2^53 - 1) inclusive to 2^53 - 1
			// inclusive.
			// 2^53 - 1 = 9007199254740991
			return iNumber <= 9007199254740991 && Math.floor(iNumber) == iNumber;
		},

		/**
		 * Serializes an array of requests to an object containing the batch request body and
		 * mandatory headers for the batch request.
		 *
		 * @param {object[]} aRequests
		 *  an array of requests objects <code>oRequest</code>
		 * @param {string} oRequest.method
		 *   HTTP method, e.g. "GET"
		 * @param {string} oRequest.url
		 *   absolute or relative URL
		 * @param {object} oRequest.headers
		 *   map of request headers
		 * @param {string} oRequest.body
		 *   request body
		 * @returns {object} object containing the following properties:
		 *   <ul>
		 *     <li><code>body</code>: batch request body;
		 *     <li><code>Content-Type</code>: value for the 'Content-Type' header;
		 *     <li><code>MIME-Version</code>: value for the 'MIME-Version' header.
		 *   </ul>
		 */
		serializeBatchRequest : function (aRequests) {
			var sBatchBoundary = jQuery.sap.uid(),
				aRequestBody = [];

			/**
			 * Serializes a map of request headers to be used in a $batch request.
			 *
			 * @param {object} mHeaders
			 *   a map of request headers
			 * @returns {string} serialized string of the given headers
			 */
			function serializeHeaders (mHeaders) {
				var sHeaderName,
					aHeaders = [];

				for (sHeaderName in mHeaders) {
					aHeaders = aHeaders.concat(sHeaderName, ":", mHeaders[sHeaderName], "\r\n");
				}

				return aHeaders.concat("\r\n");
			}

			aRequests.forEach(function(oRequest) {
				aRequestBody = aRequestBody.concat("--", sBatchBoundary,
					"\r\nContent-Type:application/http\r\n",
					"Content-Transfer-Encoding:binary\r\n\r\n",
					oRequest.method, " ", oRequest.url, " HTTP/1.1\r\n",
					serializeHeaders(oRequest.headers), oRequest.body || "", "\r\n");
			});
			aRequestBody = aRequestBody.concat("--", sBatchBoundary, "--\r\n");

			return {
				body : aRequestBody.join(""),
				"Content-Type" : "multipart/mixed; boundary=" + sBatchBoundary,
				"MIME-Version" : "1.0"
			};
		}
	};

	return Helper;
}, /* bExport= */false);
